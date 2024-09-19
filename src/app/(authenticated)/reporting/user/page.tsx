import { UserReportingPage } from "@/features/reporting-page/reporting-user-page";

interface Props {
  params: {};
  searchParams: {
    pageNumber?: string;
  };
}

export default async function Home(props: Props) {
  return <UserReportingPage page={Number(props.searchParams.pageNumber ?? 0)} />;
}
