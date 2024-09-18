import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { FC, Suspense } from "react";
import { Button } from "../ui/button";
import { DisplayError } from "../ui/error/display-error";
import { PageLoader } from "../ui/page-loader";
import { ScrollArea } from "../ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ReportingHero } from "./reporting-hero";
import { FindAllPersonaForAdmin } from "./reporting-services/reporting-service";
import PersonaRow from "./table-row-persona";

const SEARCH_PAGE_SIZE = 100;

interface PersonaReportingProps {
  page: number;
}

export const PersonaReportingPage: FC<PersonaReportingProps> = async (props) => {
  return (
    <ScrollArea className="flex-1">
      <main className="flex flex-1 flex-col">
        <ReportingHero />
        <Suspense fallback={<PageLoader />} key={props.page}>
          <ReportingContent {...props} />
        </Suspense>
      </main>
    </ScrollArea>
  );
};

async function ReportingContent(props: PersonaReportingProps) {
  let pageNumber = props.page < 0 ? 0 : props.page;
  let nextPage = pageNumber + 1;
  let previousPage = pageNumber - 1;

  const personaResponse = await FindAllPersonaForAdmin(
    SEARCH_PAGE_SIZE,
    props.page * SEARCH_PAGE_SIZE
  );

  if (personaResponse.status !== "OK") {
    return <DisplayError errors={personaResponse.errors} />;
  }

  const personas = personaResponse.response;
  const hasMoreResults = personas.length === SEARCH_PAGE_SIZE;
  return (
    <div className="container max-w-7xl py-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[10px]">Nom</TableHead>
            <TableHead className="w-[20px]">Instructions</TableHead>
            <TableHead className="w-[10px]">Température</TableHead>
            <TableHead className="w-[10px]">Modèle GPT</TableHead>
            <TableHead className="w-[10px]">Date de création</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {personas &&
            personas.map((persona) => (
              <PersonaRow key={persona.id} {...persona} />
            ))}
        </TableBody>
      </Table>
      <div className="flex gap-2 p-2 justify-end">
        {previousPage >= 0 && (
          <Button asChild size={"icon"} variant={"outline"}>
            <Link href={"/reporting/persona?pageNumber=" + previousPage}>
              <ChevronLeft />
            </Link>
          </Button>
        )}
        {hasMoreResults && (
          <Button asChild size={"icon"} variant={"outline"}>
            <Link href={"/reporting/persona?pageNumber=" + nextPage}>
              <ChevronRight />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
