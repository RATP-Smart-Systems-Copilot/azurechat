"use client";

import { PersonaModel } from "../persona-page/persona-services/models";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { User } from "./reporting-services/reporting-service";

interface PersonaProps {
    persona: PersonaModel;
    users: User[];
}

export default function ReportingPersonaPage(props: PersonaProps) {
    const persona = props.persona;
  return (
    <main className="flex flex-1 flex-col">
      <div className="container max-w-4xl py-3">
        <h1>L'assistant</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5px]">Intitulé</TableHead>
              <TableHead className="w-[200px]">Valeur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              <TableRow>
                  <TableCell className="font-medium">Nom</TableCell>
                  <TableCell>{persona.name}</TableCell>
              </TableRow>
              <TableRow>
                  <TableCell className="font-medium">Instructions</TableCell>
                  <TableCell>{persona.personaMessage}</TableCell>
              </TableRow>
              <TableRow>
                  <TableCell className="font-medium">Modèle GPT</TableCell>
                  <TableCell>{persona.gptModel}</TableCell>
              </TableRow>
              <TableRow>
                  <TableCell className="font-medium">Température</TableCell>
                  <TableCell>{persona.temperature}</TableCell>
              </TableRow>
          </TableBody>
        </Table>
        <br />
        <h2>Liste des collaborateurs</h2>
        <Table  className="w-1/2">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5px]">User</TableHead>
              <TableHead className="w-[5px]">Partagé avec</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {props.users &&
              props.users.map((user) => (
                  <TableRow  key={user.userId}>
                      <TableCell className="font-medium">{user.useName}</TableCell>
                      <TableCell>{persona.userId === user.userId || (persona.sharedWith && persona.sharedWith.includes(user.userId)) ? "YES" : "NO"}</TableCell>
                  </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
