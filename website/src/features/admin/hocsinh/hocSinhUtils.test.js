import { describe, it, expect } from "vitest";
import {
  createStudentDuplicateKey,
  isDuplicateStudent,
  normalizeDateCell
} from "./hocSinhUtils.js";

describe("Student Duplicate Detection Logic", () => {
  it("should generate consistent duplicate keys regardless of casing, extra spaces, and accents", () => {
    const key1 = createStudentDuplicateKey("  Nguyễn  Văn   A  ", "2008-05-20", 1);
    const key2 = createStudentDuplicateKey("nguyễn văn a", "2008-05-20", 1);
    const key3 = createStudentDuplicateKey("NGUYỄN VĂN A", "20/05/2008", 1);

    expect(key1).toEqual(key2);
    expect(key1).toEqual(key3);
  });

  it("should return true when a student matches an active student in the same class", () => {
    const existingStudents = [
      {
        id: 1,
        hoTen: "Nguyễn Văn A",
        ngaySinh: "2008-05-20",
        lop: { id: 10, tenLop: "10A1" },
        trangThai: 1
      },
      {
        id: 2,
        hoTen: "Trần Thị B",
        ngaySinh: "2008-08-15",
        lop: { id: 10, tenLop: "10A1" },
        trangThai: 1
      }
    ];

    const candidateSameClass = {
      hoTen: "  nguyễn văn a  ",
      ngaySinh: "2008-05-20",
      lopId: 10
    };

    expect(isDuplicateStudent(candidateSameClass, existingStudents)).toBe(true);
  });

  it("should return false when same name & birthdate but different class", () => {
    const existingStudents = [
      {
        id: 1,
        hoTen: "Nguyễn Văn A",
        ngaySinh: "2008-05-20",
        lop: { id: 10, tenLop: "10A1" },
        trangThai: 1
      }
    ];

    const candidateDifferentClass = {
      hoTen: "Nguyễn Văn A",
      ngaySinh: "2008-05-20",
      lopId: 11
    };

    expect(isDuplicateStudent(candidateDifferentClass, existingStudents)).toBe(false);
  });

  it("should return false when matching student is inactive (trangThai = 0)", () => {
    const existingStudents = [
      {
        id: 1,
        hoTen: "Nguyễn Văn A",
        ngaySinh: "2008-05-20",
        lop: { id: 10, tenLop: "10A1" },
        trangThai: 0 // Ngừng học
      }
    ];

    const candidate = {
      hoTen: "Nguyễn Văn A",
      ngaySinh: "2008-05-20",
      lopId: 10
    };

    expect(isDuplicateStudent(candidate, existingStudents)).toBe(false);
  });

  it("should return true when duplicate Ma BHYT is found for active student", () => {
    const existingStudents = [
      {
        id: 1,
        hoTen: "Nguyễn Văn A",
        ngaySinh: "2008-05-20",
        maBhyt: "DN4791234567890",
        lop: { id: 10, tenLop: "10A1" },
        trangThai: 1
      }
    ];

    const candidate = {
      hoTen: "Lê Văn C",
      ngaySinh: "2008-11-12",
      maBhyt: "  DN4791234567890  ",
      lopId: 11
    };

    expect(isDuplicateStudent(candidate, existingStudents)).toBe(true);
  });
});
