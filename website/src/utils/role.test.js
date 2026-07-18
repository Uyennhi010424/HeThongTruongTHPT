import { describe, it, expect } from "vitest";
import { roleLabel } from "./role";
import { ROLES } from "./constants";

describe("roleLabel", () => {
  it("should have label for all roles", () => {
    expect(roleLabel[ROLES.ADMIN]).toBe("Quản trị");
    expect(roleLabel[ROLES.GIAOVIEN]).toBe("Giáo viên");
    expect(roleLabel[ROLES.HOCSINH]).toBe("Học sinh");
    expect(roleLabel[ROLES.PHUHUYNH]).toBe("Phụ huynh");
  });

  it("should have 4 entries", () => {
    expect(Object.keys(roleLabel)).toHaveLength(4);
  });
});
