import { UserReportingPage } from "@/features/reporting-page/reporting-user-page";

interface Props {
  params: Promise<{}>;
  searchParams: Promise<{
    pageNumber?: string;
  }>;
}

export default async function Home(props: Props) {
  return <UserReportingPage page={Number((await props.searchParams).pageNumber ?? 0)} />;
}
