package de.tum.aet.devops25.conceptsvc;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class PricingEntity {

    @Column(length = 3)
    private String currency = "EUR";

    @Column(precision = 10, scale = 2)
    private BigDecimal earlyBird;

    @Column(precision = 10, scale = 2)
    private BigDecimal regular;

    @Column(precision = 10, scale = 2)
    private BigDecimal vip;

    @Column(precision = 10, scale = 2)
    private BigDecimal student;

    @Column(name = "group_price", precision = 10, scale = 2)
    private BigDecimal group;

    // Getters and setters
    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getEarlyBird() {
        return earlyBird;
    }

    public void setEarlyBird(BigDecimal earlyBird) {
        this.earlyBird = earlyBird;
    }

    public BigDecimal getRegular() {
        return regular;
    }

    public void setRegular(BigDecimal regular) {
        this.regular = regular;
    }

    public BigDecimal getVip() {
        return vip;
    }

    public void setVip(BigDecimal vip) {
        this.vip = vip;
    }

    public BigDecimal getStudent() {
        return student;
    }

    public void setStudent(BigDecimal student) {
        this.student = student;
    }

    public BigDecimal getGroup() {
        return group;
    }

    public void setGroup(BigDecimal group) {
        this.group = group;
    }
} 