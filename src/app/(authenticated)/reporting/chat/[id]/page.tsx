import ReportingChatPage from "@/features/reporting-page/reporting-chat-page";
import { FindAllChatMessagesForAdmin } from "@/features/reporting-page/reporting-services/reporting-service";
import { DisplayError } from "@/features/ui/error/display-error";

interface HomeParams {
  params: Promise<{
    id: string;
  }>;
}

export default async function Home(props: HomeParams) {
  const { id } = await props.params;
  const [chatResponse] = await Promise.all([
    FindAllChatMessagesForAdmin(id),
  ]);

  if (chatResponse.status !== "OK") {
    return <DisplayError errors={chatResponse.errors} />;
  }

  return (
    <ReportingChatPage chatDocuments={[]} messages={chatResponse.response} />
  );
}
