package de.tum.aet.devops25.usersvc;

import jakarta.persistence.Embeddable;

@Embeddable
public class UserPreferences {

    private String preferredEventFormat; // PHYSICAL, VIRTUAL, HYBRID
    private String industry;
    private String language;
    private String timezone;

    // Getters and setters
    public String getPreferredEventFormat() {
        return preferredEventFormat;
    }

    public void setPreferredEventFormat(String preferredEventFormat) {
        this.preferredEventFormat = preferredEventFormat;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
}
