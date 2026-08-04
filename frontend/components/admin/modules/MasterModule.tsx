import { AstrologersModule } from "./AstrologersModule";
import { CountryCodesModule } from "./CountryCodesModule";
import { ContentModule } from "./ContentModule";
import { ProductModule } from "./ProductModule";
import { RoleModule } from "./RoleModule";
import { ServicesModule } from "./ServicesModule";
import { UsersModule } from "./UsersModule";
import type { AdminDateFilter, MasterModuleKey } from "../types";

type MasterModuleProps = {
  activeSubmodule: MasterModuleKey | null;
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
      {!activeSubmodule && (
        <div className="rounded-lg border border-mist bg-white px-5 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-ink">Select a master module</p>
          <p className="mt-2 text-sm text-ink/55">
            Choose Users, Services, Roles, Astrologers, or Country Codes from
            the Master menu.
          </p>
        </div>
      )}
      {activeSubmodule === "users" && (
        <UsersModule
          initialDateFilter={userFilter}
          filterToken={filterToken}
        />
      )}
      {activeSubmodule === "services" && <ServicesModule />}
      {activeSubmodule === "products" && <ProductModule />}
      {activeSubmodule === "roles" && <RoleModule />}
      {activeSubmodule === "content" && <ContentModule />}
      {activeSubmodule === "astrologers" && <AstrologersModule />}
      {activeSubmodule === "countryCodes" && <CountryCodesModule />}
    </>
  );
}
