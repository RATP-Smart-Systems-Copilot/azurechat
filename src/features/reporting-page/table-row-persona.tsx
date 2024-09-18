"use client";
import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "../ui/table";
import { PersonaModel } from "../persona-page/persona-services/models";

interface PersonaRowProps extends PersonaModel {}

const PersonaRow: React.FC<PersonaRowProps> = (props) => {
  const persona = props;

  const router = useRouter();

  return (
    <TableRow  key={persona.id}
    className="cursor-pointer"
    onClick={() => {
        router.push("/reporting/persona/" + persona.id);
    }}>
        <TableCell>{persona.name}</TableCell>
        <TableCell>{persona.personaMessage}</TableCell>
        <TableCell>{persona.temperature}</TableCell>
        <TableCell>{persona.gptModel}</TableCell>
        <TableCell>{new Date(persona.createdAt).toLocaleDateString()}</TableCell>
    </TableRow>
  );
};

export default PersonaRow;
