import SharePointReportingPage from "@/features/reporting-page/reporting-sharepoint-page";

interface Props {
  params: {};

}

export default async function Home(props: Props) {
  return <SharePointReportingPage />;
}
