package de.tum.aet.devops25;

public class LoginResponse {

    private String token;

    // Default constructor for Jackson deserialization
    public LoginResponse() {
    }

    public LoginResponse(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}