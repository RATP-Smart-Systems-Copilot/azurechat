import ReportingPersonaPage from "@/features/reporting-page/reporting-persona-page";
import { FindAllUsersForAdmin, FindPersonaForAdmin } from "@/features/reporting-page/reporting-services/reporting-service";
import { DisplayError } from "@/features/ui/error/display-error";

interface HomeParams {
  params: {
    id: string;
  };
}

export default async function Home(props: HomeParams) {
  const [personaResponse] = await Promise.all([
    FindPersonaForAdmin(props.params.id),
  ]);

  if (personaResponse.status !== "OK") {
    return <DisplayError errors={personaResponse.errors} />;
  }

  const usersResponse = await FindAllUsersForAdmin(400,0);

  if (usersResponse.status !== "OK") {
    return <DisplayError errors={usersResponse.errors} />;
  }

  return (
    <ReportingPersonaPage persona={personaResponse.response[0]} users={usersResponse.response} />
  );
}
