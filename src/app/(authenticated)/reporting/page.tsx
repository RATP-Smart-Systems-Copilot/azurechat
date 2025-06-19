import { ReportingHomePage } from "@/features/reporting-page/reporting-home";

interface Props {
  params: Promise<{}>;
}

export default async function Home(props: Props) {
  return <ReportingHomePage/>;
}
