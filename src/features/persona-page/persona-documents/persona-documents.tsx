import { FC, useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Label } from "@/features/ui/label";
import { Button } from "@/features/ui/button";
import { Trash } from "lucide-react";
import { SharePointFilePicker } from "./sharepoint-file-picker";
import { toast } from "@/features/ui/use-toast";
import {
  convertPersonaDocumentToSharePointDocument,
  DocumentMetadata,
  SharePointFile,
} from "../persona-services/models";
import {
  DocumentDetails,
  PersonaDocumentById,
} from "@/features/persona-page/persona-services/persona-documents-service";

interface Props {
  initialPersonaDocumentIds: readonly string[];
  sharepointUrl: string;
}

export const PersonaDocuments: FC<Props> = ({ initialPersonaDocumentIds, sharepointUrl }) => {
  const { data: session } = useSession();
  const [pickedFiles, setPickedFiles] = useState<DocumentMetadata[]>([]);
  const hasInitialized = useRef(false);

  // Récupère les documents SharePoint à partir de leurs IDs
  const fetchPersonaDocuments = async (ids: readonly string[]): Promise<SharePointFile[]> => {
    try {
      const responses = await Promise.all(ids.map((id) => PersonaDocumentById(id)));
      return responses
        .map((response, idx) =>
          response.status === "OK"
            ? convertPersonaDocumentToSharePointDocument(response.response)
            : (handleErrors(response.errors, `Erreur lors de la récupération du document ID: ${ids[idx]}`), null)
        )
        .filter(Boolean) as SharePointFile[];
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
      return [];
    }
  };

  const addDocumentsWithMetadata = useCallback(
    async (documents: SharePointFile[]) => {
      if (!documents.length) return;

      const response = await DocumentDetails(documents);
      if (response.status !== "OK") {
        handleErrors(response.errors, "Erreur lors de la récupération des métadonnées.");
        return;
      }

      // Gestion des erreurs partielles
      if (response.response.unsuccessful.length > 0) {
        const unsuccessfulIds = response.response.unsuccessful.map((f) => f.documentId).join(", ");
        handleErrors(
          [{ message: `Erreur sur les documents : ${unsuccessfulIds}` }],
          "Erreur lors de la récupération des métadonnées."
        );
      }

      // Gestion des fichiers trop volumineux
      if (response.response.sizeToBig.length > 0) {
        const tooBigNames = response.response.sizeToBig.map((f) => f.name).join(", ");
        toast({
          title: "Fichiers trop volumineux",
          description: `Les fichiers suivants dépassent la taille autorisée : ${tooBigNames}`,
          variant: "destructive",
        });
      }

      const newFiles = documents
        .map((file) => {
          const matchingDocument = response.response.successful.find(
            (doc) => doc.documentId === file.documentId
          );
          return matchingDocument ? { ...matchingDocument, id: file.id } : null;
        })
        .filter(Boolean);

      // Fusionne les anciens fichiers et les nouveaux, sans doublons
      setPickedFiles((prev) => {
        const filesMap = new Map();
        // Ajoute les anciens fichiers
        prev.forEach((file) => filesMap.set(file.documentId, file));
        // Ajoute/écrase avec les nouveaux fichiers
        newFiles.forEach((file) => {
          if (file) {
            filesMap.set(file.documentId, file);
          }
        });
        return Array.from(filesMap.values());
      });
    },
    []
  );

  // Gestion des erreurs
  const handleErrors = (errors: { message: string }[] | undefined, fallback: string) => {
    toast({
      title: "Erreur",
      description: errors?.map((err) => err.message).join(", ") || fallback,
      variant: "destructive",
    });
  };

  // Suppression d'un document
  const removeDocument = (documentId: string) => {
    setPickedFiles((prev) => prev.filter((f) => f.documentId !== documentId));
  };

  // Initialisation : ne se fait qu'une seule fois
  useEffect(() => {
    const fetchInitialDocuments = async () => {
      if (!initialPersonaDocumentIds?.length) return;
      const personaDocuments = await fetchPersonaDocuments(initialPersonaDocumentIds);
      await addDocumentsWithMetadata(personaDocuments);
    };

    if (!hasInitialized.current && initialPersonaDocumentIds?.length) {
      hasInitialized.current = true;
      fetchInitialDocuments();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPersonaDocumentIds]);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between space-x-2">
        <Label>Documents SharePoint</Label>
        <SharePointFilePicker
          token={session?.user && "accessToken" in session.user ? (session.user.accessToken as string) : ""}
          sharepointUrl={sharepointUrl}
          onFilesSelected={addDocumentsWithMetadata}
        />
      </div>
      <div className="flex items-center w-full">
        <input
          type="hidden"
          name="selectedSharePointDocumentIds"
          value={JSON.stringify(pickedFiles)}
        />
        <input
          type="hidden"
          name="personaDocumentIds"
          value={JSON.stringify(initialPersonaDocumentIds)}
        />

        {pickedFiles.length === 0 ? (
          <div className="p-2 flex items-center justify-center w-full text-muted-foreground">
            Aucun fichier sélectionné
          </div>
        ) : (
          <div className="w-full">
            {pickedFiles.map((file) => (
              <div
                key={file.documentId}
                className={`flex items-center justify-between space-x-2 border rounded-md p-2 mb-2 border-input ${
                  file.id ? 'bg-primary/50' : 'bg-background'
                }`}
              >
                <div>
                  <p>{file.name}</p>
                  <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                    <p>{new Date(file.createdDateTime).toLocaleDateString("de-CH")}</p>
                    <span>|</span>
                    <p>{file.createdBy}</p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  onClick={() => removeDocument(file.documentId)}
                >
                  <Trash size={15} className="text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
