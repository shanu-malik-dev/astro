import { AstrologersModule } from "./AstrologersModule";
import { CountryCodesModule } from "./CountryCodesModule";
import { ProductModule } from "./ProductModule";
import { RoleModule } from "./RoleModule";
import { ServicesModule } from "./ServicesModule";
import { UsersModule } from "./UsersModule";
import type { AdminDateFilter, MasterModuleKey } from "../types";

type MasterModuleProps = {
  activeSubmodule: MasterModuleKey;
  userFilter?: AdminDateFilter | null;
  filterToken?: number;
};

export function MasterModule({
  activeSubmodule,
  userFilter,
  filterToken,
}: MasterModuleProps) {
  return (
    <>
      {activeSubmodule === "users" && (
        <UsersModule
          initialRoleName="Customer"
          initialDateFilter={userFilter}
          filterToken={filterToken}
        />
      )}
      {activeSubmodule === "services" && <ServicesModule />}
      {activeSubmodule === "products" && <ProductModule />}
      {activeSubmodule === "roles" && <RoleModule />}
      {activeSubmodule === "astrologers" && <AstrologersModule />}
      {activeSubmodule === "countryCodes" && <CountryCodesModule />}
    </>
  );
}
