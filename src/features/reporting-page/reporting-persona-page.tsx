"use client";

import { useState } from "react";
import { PersonaModel } from "../persona-page/persona-services/models";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { User } from "./reporting-services/reporting-service";
import { UpsertPersona } from "../persona-page/persona-services/persona-service";

interface PersonaProps {
    persona: PersonaModel;
    users: User[];
}

export default function ReportingPersonaPage(props: PersonaProps) {
  const [persona, setPersona] = useState(props.persona);
  const [searchTerm, setSearchTerm] = useState("");

  const handleShareWithUser = async (userId: string) => {
    const updatedSharedWith = [...(persona.sharedWith || []), userId];
    const updatedPersona = { ...persona, sharedWith: updatedSharedWith };
    const response = await UpsertPersona(updatedPersona);

    if (response.status === "OK") {
      setPersona(updatedPersona);
    }

  };

  const handleUnshareWithUser = async (userId: string) => {
    const updatedSharedWith = (persona.sharedWith || []).filter(id => id !== userId);
    const updatedPersona = { ...persona, sharedWith: updatedSharedWith };
    const response = await UpsertPersona(updatedPersona);

    if (response.status === "OK") {
      setPersona(updatedPersona);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
  };

  const filteredUsers = props.users.filter(user =>
      user.useName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
      <main className="flex flex-1 flex-col">
          <div className="container max-w-4xl py-3">
              <h1>Assistant</h1>
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
                      <TableRow>
                          <TableCell className="font-medium">Partagé avec</TableCell>
                          <TableCell>{persona.sharedWith}</TableCell>
                      </TableRow>
                      <TableRow>
                          <TableCell className="font-medium">Propriétaire</TableCell>
                          <TableCell>{persona.userId}</TableCell>
                      </TableRow>
                  </TableBody>
              </Table>
              <br />
              <h2>Liste des collaborateurs</h2>
              <input
                  type="text"
                  placeholder="Rechercher par nom ou prénom"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="mb-4 p-2 border border-gray-300 rounded"
              />
              <div className="overflow-y-auto max-h-96">
                  <Table className="w-1/2">
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[5px]">User</TableHead>
                              <TableHead className="w-[5px]">User ID</TableHead>
                              <TableHead className="w-[5px]">Partagé avec</TableHead>
                              <TableHead className="w-[5px]">Action</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {filteredUsers.map((user) => (
                              <TableRow key={user.userId}>
                                  <TableCell className="font-medium">{user.useName}</TableCell>
                                  <TableCell className="font-medium">{user.userId}</TableCell>
                                  <TableCell>{persona.userId === user.userId || (persona.sharedWith && persona.sharedWith.includes(user.userId)) ? "YES" : "NO"}</TableCell>
                                  <TableCell>
                                    {!(persona.sharedWith && persona.sharedWith.includes(user.userId)) ? (
                                            <button onClick={() => handleShareWithUser(user.userId)} className="btn-share">
                                                Share
                                            </button>
                                        ) : (
                                            <button onClick={() => handleUnshareWithUser(user.userId)} className="btn-unshare">
                                                Unshare
                                            </button>
                                    )}
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
          </div>
      </main>
  );
}

