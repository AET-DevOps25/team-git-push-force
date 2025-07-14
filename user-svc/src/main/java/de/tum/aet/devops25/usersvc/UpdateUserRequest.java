package de.tum.aet.devops25.usersvc;

public class UpdateUserRequest {

    private String firstName;
    private String lastName;
    private String email;
    private de.tum.aet.devops25.api.generated.model.UserPreferences preferences;

    public de.tum.aet.devops25.api.generated.model.UserPreferences getPreferences() {
        return preferences;
    }

    public void setPreferences(de.tum.aet.devops25.api.generated.model.UserPreferences preferences) {
        this.preferences = preferences;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
