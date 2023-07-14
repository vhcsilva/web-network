import BountiesList from "components/bounty/bounties-list/controller";

import { SearchBountiesPaginated } from "types/api";

interface ManagementProps {
  bounties: SearchBountiesPaginated;
}

export default function Management({
  bounties
}: ManagementProps) {
  return(
    <div className="mt-4">
      <BountiesList bounties={bounties} variant="management" />
    </div>
  );
}
