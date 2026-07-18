package com.hethongtruongthpt.common;

import com.hethongtruongthpt.enums.HocLucEnum;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public class Utils {
	public static double average(List<Double> values) {
		if (values == null || values.isEmpty()) {
			return 0.0;
		}
		double sum = 0.0;
		for (Double value : values) {
			sum += value == null ? 0.0 : value;
		}
		return round(sum / values.size(), 2);
	}

	public static double round(double value, int scale) {
		return BigDecimal.valueOf(value)
				.setScale(scale, RoundingMode.HALF_UP)
				.doubleValue();
	}

	/**
	 * Xếp loại học lực theo Thông tư 22/2021/TT-BGDĐT.
	 *
	 * @param diemTBCaNam  Điểm trung bình tất cả các môn cả năm
	 * @param diemTBMons   Danh sách ĐTB cả năm của từng môn học
	 * @return Xếp loại học lực
	 */
	public static HocLucEnum xepLoaiHocLuc(List<String> commentResults, List<Double> diemTBMons) {
		if (diemTBMons == null || diemTBMons.isEmpty()) {
			return HocLucEnum.CHUA_DAT;
		}

		long commentNotReached = commentResults == null ? 0 : commentResults.stream().filter(r -> !"DAT".equals(r)).count();
		long totalCommentSubjects = commentResults == null ? 0 : commentResults.size();

		boolean allCommentReached = commentNotReached == 0;
		boolean allAbove65 = diemTBMons.stream().allMatch(d -> d != null && d >= 6.5);
		boolean allAbove50 = diemTBMons.stream().allMatch(d -> d != null && d >= 5.0);
		boolean allAbove35 = diemTBMons.stream().allMatch(d -> d != null && d >= 3.5);

		long countAbove80 = diemTBMons.stream().filter(d -> d != null && d >= 8.0).count();
		long countAbove65 = diemTBMons.stream().filter(d -> d != null && d >= 6.5).count();
		long countAbove50 = diemTBMons.stream().filter(d -> d != null && d >= 5.0).count();

		// 1. Tốt: Đạt tất cả nhận xét + Tất cả môn điểm số >= 6.5 + Ít nhất 6 môn >= 8.0
		if (allCommentReached && allAbove65 && countAbove80 >= 6) {
			return HocLucEnum.TOT;
		}

		// 2. Khá: Đạt tất cả nhận xét + Tất cả môn điểm số >= 5.0 + Ít nhất 6 môn >= 6.5
		if (allCommentReached && allAbove50 && countAbove65 >= 6) {
			return HocLucEnum.KHA;
		}

		// 3. Đạt: Tối đa 1 nhận xét Chưa đạt + Tất cả môn điểm số >= 3.5 + Ít nhất 6 môn >= 5.0
		boolean maxOneCommentFailed = totalCommentSubjects > 0 ? commentNotReached <= 1 : true;
		if (maxOneCommentFailed && allAbove35 && countAbove50 >= 6) {
			return HocLucEnum.DAT;
		}

		// 4. Chưa đạt: Các trường hợp còn lại
		return HocLucEnum.CHUA_DAT;
	}

	private Utils() {
	}
}
