import { PersonaReportingPage } from "@/features/reporting-page/reporting-personas-page";

interface Props {
  params: {};
  searchParams: {
    pageNumber?: string;
  };
}

export default async function Home(props: Props) {
  return <PersonaReportingPage page={Number((await props.searchParams).pageNumber ?? 0)} />;
}
