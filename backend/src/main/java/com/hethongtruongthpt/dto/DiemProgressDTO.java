package com.hethongtruongthpt.dto;

public class DiemProgressDTO {
    private Integer lopId;
    private String tenLop;
    private String tenGvcn;
    private Integer siSo;
    private Integer totalExpectedScores;
    private Integer totalEnteredScores;
    private Double progressPercentage;
    private Boolean hasScores;
    private Boolean isCompleted;

    public DiemProgressDTO() {}

    public DiemProgressDTO(Integer lopId, String tenLop, String tenGvcn, Integer siSo, Integer totalExpectedScores, Integer totalEnteredScores, Double progressPercentage, Boolean hasScores) {
        this.lopId = lopId;
        this.tenLop = tenLop;
        this.tenGvcn = tenGvcn;
        this.siSo = siSo;
        this.totalExpectedScores = totalExpectedScores;
        this.totalEnteredScores = totalEnteredScores;
        this.progressPercentage = progressPercentage;
        this.hasScores = hasScores;
        this.isCompleted = totalExpectedScores != null && totalExpectedScores > 0 && totalEnteredScores != null && totalEnteredScores >= totalExpectedScores;
    }

    public Boolean getIsCompleted() { return isCompleted; }
    public void setIsCompleted(Boolean isCompleted) { this.isCompleted = isCompleted; }

    public Boolean getHasScores() { return hasScores; }
    public void setHasScores(Boolean hasScores) { this.hasScores = hasScores; }

    public Integer getLopId() { return lopId; }
    public void setLopId(Integer lopId) { this.lopId = lopId; }

    public String getTenLop() { return tenLop; }
    public void setTenLop(String tenLop) { this.tenLop = tenLop; }

    public String getTenGvcn() { return tenGvcn; }
    public void setTenGvcn(String tenGvcn) { this.tenGvcn = tenGvcn; }

    public Integer getSiSo() { return siSo; }
    public void setSiSo(Integer siSo) { this.siSo = siSo; }

    public Integer getTotalExpectedScores() { return totalExpectedScores; }
    public void setTotalExpectedScores(Integer totalExpectedScores) { this.totalExpectedScores = totalExpectedScores; }

    public Integer getTotalEnteredScores() { return totalEnteredScores; }
    public void setTotalEnteredScores(Integer totalEnteredScores) { this.totalEnteredScores = totalEnteredScores; }

    public Double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Double progressPercentage) { this.progressPercentage = progressPercentage; }
}
