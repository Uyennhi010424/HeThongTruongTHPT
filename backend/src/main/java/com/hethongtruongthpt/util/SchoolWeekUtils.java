package com.hethongtruongthpt.util;

import com.hethongtruongthpt.entity.NamHoc;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

public final class SchoolWeekUtils {

    private SchoolWeekUtils() {}

    public static LocalDate mondayOfWeekContaining(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    /** Số tuần trong năm học (tuần 1 = tuần chứa ngày bắt đầu HK1). */
    public static int weekNumber(NamHoc namHoc, LocalDate date) {
        LocalDate week1 = mondayOfWeekContaining(namHoc.getNgayBatDauHk1());
        LocalDate target = mondayOfWeekContaining(date);
        long diff = ChronoUnit.WEEKS.between(week1, target);
        return (int) Math.max(1, diff + 1);
    }

    public static int semesterWeekMin(NamHoc namHoc, int hocKy) {
        LocalDate start = hocKy == 2 ? namHoc.getNgayBatDauHk2() : namHoc.getNgayBatDauHk1();
        return weekNumber(namHoc, start);
    }

    public static int semesterWeekMax(NamHoc namHoc, int hocKy) {
        LocalDate end = hocKy == 2 ? namHoc.getNgayKetThucHk2() : namHoc.getNgayKetThucHk1();
        return weekNumber(namHoc, end);
    }

    public static boolean isWeekInSemester(NamHoc namHoc, int hocKy, int tuan) {
        if (namHoc == null || tuan < 1) return false;
        int min = Math.min(semesterWeekMin(namHoc, hocKy), semesterWeekMax(namHoc, hocKy));
        int max = Math.max(semesterWeekMin(namHoc, hocKy), semesterWeekMax(namHoc, hocKy));
        return tuan >= min && tuan <= max;
    }
}
