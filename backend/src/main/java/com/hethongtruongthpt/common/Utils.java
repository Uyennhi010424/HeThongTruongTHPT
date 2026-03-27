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

	public static HocLucEnum xepLoaiHocLuc(double diemTrungBinh) {
		if (diemTrungBinh >= 8.0) {
			return HocLucEnum.GIOI;
		}
		if (diemTrungBinh >= 6.5) {
			return HocLucEnum.KHA;
		}
		if (diemTrungBinh >= 5.0) {
			return HocLucEnum.TRUNG_BINH;
		}
		return HocLucEnum.YEU;
	}

	private Utils() {
	}
}
