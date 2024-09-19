"use client";

import { PersonaModel } from "../persona-page/persona-services/models";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface PersonaProps {
    persona: PersonaModel;
}

export default function ReportingPersonaPage(props: PersonaProps) {
    const persona = props.persona;
  return (
    <main className="flex flex-1 relative flex-col">
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
    </main>
  );
}
