
import { ClientSecretCredential } from "@azure/identity";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";


// eslint-disable-next-line @next/next/no-async-client-component
export default async function SharePointReportingPage() {
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
    const siteId = "ixximobility.sharepoint.com,2e503fdb-ebdd-4259-a6e4-453f5f538fd7,ec5b9f4f-59f7-4aee-82b2-ae9b719514f6"; // Vous pouvez récupérer cet ID via Graph Explorer ou API
    const { Client } = require('@microsoft/microsoft-graph-client');

    // Authentification avec ClientSecretCredential
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    
    async function getAccessToken() {
      const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default');
      return tokenResponse.token;
    }
    
    // Initialiser le client Microsoft Graph
    async function getGraphClient() {
      const token = await getAccessToken().catch(console.error);
      const client = Client.init({
        authProvider: (done: (arg0: null, arg1: any) => void) => {
          done(null, token);
        },
      });
      return client;
    }
    
    async function getDocuments() {
        const client = await getGraphClient();
      
        const drivesResponse: any = await client
          .api(`/sites/${siteId}/drives`)
          .get();
      
        const drives = drivesResponse.value;
      
        // Construire un tableau avec les drives et leurs fichiers
        const data: { driveName: string; files: { name: string; type: string }[] }[] = [];
      
        for (const drive of drives) {
          const filesResponse: any = await client
            .api(`/drives/${drive.id}/root/children`)
            .get();
      
          const files = filesResponse.value.map((file: any) => ({
            name: file.name,
            type: file.file ? 'Fichier' : 'Dossier',
          }));
      
          data.push({
            driveName: drive.name,
            files,
          });
        }
      
        return data;
      }

      async function getSharePointPages() {
        const client = await getGraphClient(); // Authentifie ton client Microsoft Graph
      
        // Appel à l'API Graph pour récupérer toutes les pages
        const pagesResponse = await client
          .api(`/sites/${siteId}/pages`)
          .get();
      
        const pages = pagesResponse.value;
      
        const data: {
          pageTitle: string;
          pageId: string;
          contentBlocks: { type: string; html: string }[];
        }[] = [];
      
        for (const page of pages) {
          const pageId = page.id;
      
          // Récupérer la mise en page (canvasLayout) avec les composants
          const detailedPage = await client
            .api(`/sites/${siteId}/pages/${pageId}/microsoft.graph.sitePage/webparts`)
            .get();

            const blocks: { type: string; html: string }[] = [];

            const sections = detailedPage.value || [];

            for (const section of sections) {
              if( section['@odata.type'] === '#microsoft.graph.textWebPart'){
                const type = "text";
                const html =  section['innerHtml'];
                blocks.push({ type, html });
            }

            }
          data.push({
            pageTitle: page.title,
            pageId,
            contentBlocks: blocks,
          });
        }
      
        return data;
      }
      
      const documentsData = await getDocuments();
      const pagesData = await getSharePointPages();
    

    return (
        <main className="flex flex-col overflow-auto max-h-screen">
          <div className="container max-w-4xl py-3">
            <h1>Bibliothèques et fichiers SharePoint</h1>
            {documentsData.map((drive, index) => (
              <div key={index} className="mb-6">
                <h2 className="font-semibold text-lg mb-2">{drive.driveName}</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Nom du fichier/dossier</TableHead>
                      <TableHead className="w-[150px]">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drive.files.length > 0 ? (
                      drive.files.map((file, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{file.name}</TableCell>
                          <TableCell>{file.type}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center italic">
                          Aucun fichier dans cette bibliothèque
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ))}
            <h1>Pages du Site</h1>
            {pagesData.map((page, index) => (
                <div key={index} className="mb-6">
                    <h2 className="font-semibold text-lg mb-2">{page.pageTitle}</h2>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[150px]">Type de bloc</TableHead>
                        <TableHead className="w-[600px]">Contenu HTML</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {page.contentBlocks.length > 0 ? (
                        page.contentBlocks.map((block, idx) => (
                            <TableRow key={idx}>
                            <TableCell>{block.type}</TableCell>
                            <TableCell>
                                <div
                                className="prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: block.html }}
                                />
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center italic">
                            Aucun contenu dans cette page
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
                ))}

          </div>
        </main>
      );
    }
