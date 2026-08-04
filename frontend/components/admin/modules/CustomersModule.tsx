import { UsersModule } from "./UsersModule";
import type { AdminDateFilter } from "../types";

export function CustomersModule({
  initialDateFilter,
  filterToken,
}: {
  initialDateFilter?: AdminDateFilter | null;
  filterToken?: number;
}) {
  return (
    <UsersModule
      lockedRoleName="Customer"
      initialDateFilter={initialDateFilter}
      filterToken={filterToken}
    />
  );
}
