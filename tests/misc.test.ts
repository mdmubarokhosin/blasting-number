import { describe, expect, it } from "vitest";
import { canCreateList, canDeleteList, canEditList } from "../src/utils/permissions";
import { listToArray } from "../src/utils/listItems";
import { makeItem, makeList, makeProfile } from "./factories";

function allow(...ids: string[]) {
  return (id: string) => ids.includes(id);
}

describe("listToArray", () => {
  it("sorts items by createdAt ascending", () => {
    const list = makeList({
      items: {
        late: makeItem({ id: "late", createdAt: 300 }),
        early: makeItem({ id: "early", createdAt: 100 }),
        middle: makeItem({ id: "middle", createdAt: 200 }),
      },
    });
    expect(listToArray(list).map((item) => item.id)).toEqual(["early", "middle", "late"]);
  });
});

describe("canEditList", () => {
  const list = makeList({ ownerId: "owner-1" });

  it("allows an owner with lists.editOwn", () => {
    expect(
      canEditList({
        list,
        profile: makeProfile({ uid: "owner-1" }),
        can: allow("lists.editOwn"),
      }),
    ).toBe(true);
  });

  it("allows another user only with lists.editAny", () => {
    const profile = makeProfile({ uid: "someone-else" });
    expect(canEditList({ list, profile, can: allow("lists.editOwn") })).toBe(false);
    expect(canEditList({ list, profile, can: allow("lists.editAny") })).toBe(true);
  });

  it("denies users without the permission", () => {
    expect(
      canEditList({ list, profile: makeProfile({ uid: "owner-1" }), can: allow("lists.view") }),
    ).toBe(false);
  });

  it("denies inactive profiles and signed-out users even when permission checks pass", () => {
    expect(
      canEditList({
        list,
        profile: makeProfile({ uid: "owner-1", active: false }),
        can: allow("lists.editOwn", "lists.editAny"),
      }),
    ).toBe(false);
    expect(canEditList({ list, profile: null, can: allow("lists.editOwn") })).toBe(false);
  });
});

describe("canDeleteList", () => {
  const list = makeList({ ownerId: "owner-1" });

  it("distinguishes own and any deletion permissions", () => {
    const owner = makeProfile({ uid: "owner-1" });
    const other = makeProfile({ uid: "other" });
    expect(canDeleteList({ list, profile: owner, can: allow("lists.deleteOwn") })).toBe(true);
    expect(canDeleteList({ list, profile: other, can: allow("lists.deleteOwn") })).toBe(false);
    expect(canDeleteList({ list, profile: other, can: allow("lists.deleteAny") })).toBe(true);
  });

  it("denies inactive profiles", () => {
    expect(
      canDeleteList({
        list,
        profile: makeProfile({ uid: "owner-1", active: false }),
        can: allow("lists.deleteAny"),
      }),
    ).toBe(false);
  });
});

describe("canCreateList", () => {
  it("uses lists.create", () => {
    expect(canCreateList(allow("lists.create"))).toBe(true);
    expect(canCreateList(allow("lists.view"))).toBe(false);
  });
});
