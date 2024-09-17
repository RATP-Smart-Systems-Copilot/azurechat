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
import { FindAllChatThreadsForAdmin, FindAllUsersForAdmin } from "./reporting-services/reporting-service";
import ChatThreadRow from "./table-row";

const SEARCH_PAGE_SIZE = 100;

interface UserReportingProps {
  page: number;
}

export const UserReportingPage: FC<UserReportingProps> = async (props) => {
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

async function ReportingContent(props: UserReportingProps) {
  let pageNumber = props.page < 0 ? 0 : props.page;
  let nextPage = pageNumber + 1;
  let previousPage = pageNumber - 1;

  const usersResponse = await FindAllUsersForAdmin(
    SEARCH_PAGE_SIZE,
    props.page * SEARCH_PAGE_SIZE
  );

  if (usersResponse.status !== "OK") {
    return <DisplayError errors={usersResponse.errors} />;
  }

  const users = usersResponse.response;
  const hasMoreResults = users.length === SEARCH_PAGE_SIZE;
  return (
    <div className="container max-w-4xl py-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Utilisateurs</TableHead>
            <TableHead className="w-[200px]">ID</TableHead>
            <TableHead className="w-[50px]">Nombre de Chat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users &&
            users.map((user) => (
                <TableRow  key={user.userId}>
                    <TableCell className="font-medium">{user.useName}</TableCell>
                    <TableCell>{user.userId}</TableCell>
                    <TableCell>{user.chats}</TableCell>
                </TableRow>
            ))}
        </TableBody>
      </Table>
      <div className="flex gap-2 p-2 justify-end">
        {previousPage >= 0 && (
          <Button asChild size={"icon"} variant={"outline"}>
            <Link href={"/reporting/user?pageNumber=" + previousPage}>
              <ChevronLeft />
            </Link>
          </Button>
        )}
        {hasMoreResults && (
          <Button asChild size={"icon"} variant={"outline"}>
            <Link href={"/reporting/user?pageNumber=" + nextPage}>
              <ChevronRight />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
