"use client";

import { useSession } from "next-auth/react";
import { FC, useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ServerActionResponse } from "../common/server-action-response";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { LoadingIndicator } from "../ui/loading";
import { ScrollArea } from "../ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import {
  addOrUpdatePersona,
  getDocumentsPersona,
  personaStore,
  usePersonaState,
} from "./persona-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { AttachFile } from "../ui/chat/chat-input-area/attach-file";
import { fileStore, useFileStore } from "./file/file-store";
import { ChatDocumentModel } from "../chat-page/chat-services/models";
import { CheckIcon, File, Trash2 } from "lucide-react";
import { modelOptions } from "../theme/theme-config";
import { PersonaDocuments } from "./persona-documents/persona-documents";

interface Props {}

export const AddNewPersona: FC<Props> = (props) => {
  const initialState: ServerActionResponse | undefined = undefined;

  const { isOpened, persona } = usePersonaState();
  const { uploadButtonLabel } = useFileStore();
  const [documentsPersona, setDocumentsPersona] = useState<Array<ChatDocumentModel>>([]);
  const [deletedDocIds, setDeletedDocIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);



  useEffect(() => {
    const fetchDocuments = async () => {
      setDocumentsPersona([]);
      if (persona.id) {
        const documents = await getDocumentsPersona(persona.id);
        setDocumentsPersona(documents);
      }
    };

    fetchDocuments();
  }, [persona.id, , refreshKey]);

  const [formState, formAction] = useFormState(
    addOrUpdatePersona,
    initialState
  );

  const { data } = useSession();

  const PublicSwitch = () => {
    if (data === undefined || data === null) return null;

    //if (data?.user?.isAdmin) {
    if(persona.id){
      return (
        <div className="flex items-center space-x-2">
          <Switch name="isPublished" defaultChecked={persona.isPublished} />
          <Label htmlFor="description">Publier à tous les collaborateurs</Label>
        </div>
      );
    }
  };

  const AttachFileToPersona = () => {
    if (data === undefined || data === null) return null;

    if(persona.id){
      const personaId = persona.id;
      return (
        <div className="grid gap-2">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-4">
              <Label>Documents depuis votre ordinateur</Label>
            </div>
            <AttachFile
              onClick={(formData) =>
                fileStore.onFileChange({ formData, personaId })
              }
            />
          </div>
        </div>
      );
    }
  };


  const handleButtonDeleteClick = (doc: ChatDocumentModel) => {
    fileStore.onDelete(doc, persona.id);
    setDeletedDocIds(prev => new Set(prev).add(doc.id));
    setRefreshKey(prev => prev + 1); // Force le rechargement des documents
  };


  return (
    <Sheet
      open={isOpened}
      onOpenChange={(value) => {
        personaStore.updateOpened(value);
      }}
    >
      <SheetContent className="min-w-[900px] sm:w-[700px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Agent IA</SheetTitle>
        </SheetHeader>
        <form action={formAction} className="flex-1 flex flex-col">
          <ScrollArea
            className="flex-1 -mx-6 flex max-h-[calc(100vh-140px)]"
            type="always"
          >
          <div className="pb-6 px-6 flex gap-8 flex-col flex-1">
              <input type="hidden" name="id" defaultValue={persona.id} />
              {formState && formState.status === "OK" ? null : (
                <>
                  {formState &&
                    formState.errors.map((error, index) => (
                      <div key={index} className="text-red-500">
                        {error.message}
                      </div>
                    ))}
                </>
              )}
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <Label>Nom de l&apos;assistant</Label>
                  <Input
                    type="text"
                    required
                    name="name"
                    className="min-w-[300px]"
                    defaultValue={persona.name}
                    placeholder="Name of your persona"
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    type="text"
                    required
                    defaultValue={persona.description}
                    name="description"
                    className="min-w-[250px]"
                    placeholder="Short description"
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="temperature">Température</Label>
                  <Input
                    type="number"
                    required
                    defaultValue={persona.temperature}
                    name="temperature"
                    min={0}
                    max={2.0}
                    step={0.1}
                    placeholder="Température compris entre 0 et 2.0"
                  />
                </div>
                <div className="grid gap-2 flex-1 ">
                  <Label htmlFor="gptModel">Modèle GPT</Label>
                  <Select
                    defaultValue={persona.gptModel}
                    name="gptModel"
                    required
                  >
                    <SelectTrigger className="w-[100px]" aria-label="Select GPT Model">
                      <SelectValue placeholder="Sélectionnez un modèle" defaultValue={persona.gptModel} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(modelOptions).filter(([_, model]) => model.provider === 'OpenAI' && model.enable).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2 flex-1 ">
                <Label htmlFor="personaMessage">Contexte</Label>
                <Textarea
                  className="min-h-[300px]"
                  required
                  defaultValue={persona.personaMessage}
                  name="personaMessage"
                  placeholder="Personality of your persona"
                />
              </div>
              <p>Base de connaissance : </p>
              <div className="pb-6 px-6 flex gap-2 flex-col  flex-1 border bg-background ">
                <AttachFileToPersona />
                {documentsPersona.length === 0 ? (
                  <div className="p-2 flex items-center justify-center w-full text-muted-foreground">
                  Aucun fichier
                </div>
                ) : (
                  documentsPersona.map((doc) => {
                    return (
                      <div className="flex gap-2 items-center" key={doc.id}>
                        <File size={16} /> <div>{doc.name}</div>
                        <Button
                          type="button"
                          variant={"ghost"}
                          size={"sm"}
                          title="Supprimer le document"
                          className="flex items-center hover:bg-gray-100 transition-colors duration-150 rounded"
                          onClick={() => handleButtonDeleteClick(doc)}
                        >
                        {deletedDocIds.has(doc.id) ? <CheckIcon size={16} /> : <Trash2 size={16} />}
                        </Button>
                      </div>
                    );
                  })
                )}
                <PersonaDocuments initialPersonaDocumentIds={[]}/>
              </div>
          </div>
          </ScrollArea>
          <Input
                  type="hidden"
                  value={persona.sharedWith}
                  name="sharedWith"
                  placeholder="sharedWith"
                />
          <SheetFooter className="py-2 flex sm:justify-between flex-row">
            <PublicSwitch /> <Submit />
          </SheetFooter>
          <div className=" flex justify-center">
            <div className="border bg-background p-2 px-5  rounded-full flex gap-2 items-center text-sm">
              {uploadButtonLabel}
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

function Submit() {
  const status = useFormStatus();
  return (
    <Button disabled={status.pending} className="gap-2">
      <LoadingIndicator isLoading={status.pending} />
      Save
    </Button>
  );
}
