import Link from "next/link";
import { Suspense } from "react";
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
import { CountAllChatThreadsForAdmin, CountAllUsersForAdmin } from "./reporting-services/reporting-service";
import { DisplayError } from "../ui/error/display-error";

export const ReportingHomePage = async () => {
  return (
    <ScrollArea className="flex-1">
      <main className="flex flex-1 flex-col">
        <ReportingHero />
        <Suspense fallback={<PageLoader />} >
          <ReportingContent />
        </Suspense>
      </main>
    </ScrollArea>
  );
};

interface ChatReportingProps {
    page: number;
}

async function ReportingContent() {
    const countAllChat = await CountAllChatThreadsForAdmin();
    const allUsers = await CountAllUsersForAdmin();

    if (countAllChat.status !== "OK") {
        return <DisplayError errors={countAllChat.errors} />;
    }

    if (allUsers.status !== "OK") {
        return <DisplayError errors={allUsers.errors} />;
    }

  const resultCountChat = countAllChat.response;
  const countAllUsers = allUsers.response;

  return (
    <div className="container max-w-4xl py-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Intitulé</TableHead>
            <TableHead className="w-[200px]">Valeur</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow>
                <TableCell className="font-medium">Nombre de chat</TableCell>
                <TableCell className="font-medium"><Link href={"/reporting/chat"}>{resultCountChat} </Link></TableCell>
            </TableRow>
            <TableRow>
                <TableCell className="font-medium">Nombre de collaborateur</TableCell>
                <TableCell className="font-medium"><Link href={"/reporting/user"}>{countAllUsers} </Link></TableCell>
            </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
