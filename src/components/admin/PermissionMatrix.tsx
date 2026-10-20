import { Checkbox, Label } from "@heroui/react";
import { type ReactNode, useMemo } from "react";
import {
  PERMISSIONS,
  PERMISSION_MODULES,
  moduleLabel,
  normalizePermissionIds,
  removePermissionWithDependents,
} from "../../lib/permissions";

export function PermissionMatrix({
  selected,
  onChange,
  disabled = false,
  allSelected = false,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  allSelected?: boolean;
}): ReactNode {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const grouped = useMemo(
    () =>
      PERMISSION_MODULES.map((module) => ({
        module,
        label: moduleLabel(module),
        permissions: PERMISSIONS.filter((permission) => permission.module === module),
      })),
    [],
  );

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange(normalizePermissionIds([...selected, id]));
    } else {
      onChange(removePermissionWithDependents(selected, id));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {grouped.map((group) => {
        const activeCount = group.permissions.filter((permission) =>
          selectedSet.has(permission.id),
        ).length;
        return (
          <section key={group.module} className="rounded-xl border p-3">
            <header className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{group.label}</h3>
              <span className="text-muted text-xs">
                {activeCount}/{group.permissions.length}
              </span>
            </header>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.permissions.map((permission) => {
                const isSelected = allSelected || selectedSet.has(permission.id);
                const isDisabled = disabled || allSelected || permission.protected;
                return (
                  <Checkbox
                    key={permission.id}
                    name={`permission-${permission.key}`}
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    onChange={(checked) => toggle(permission.id, checked)}
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Content>
                      <Label className="text-sm">{permission.label}</Label>
                      <p className="text-muted text-xs">
                        {permission.description}
                        {permission.protected ? " · শুধু Master Admin" : ""}
                      </p>
                    </Checkbox.Content>
                  </Checkbox>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
