package de.tum.aet.devops25.usersvc;

import java.io.IOException;
import java.time.OffsetDateTime;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import de.tum.aet.devops25.api.generated.model.ErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public CustomAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {

        String requestURI = request.getRequestURI();
        String authHeader = request.getHeader("Authorization");

        ErrorResponse error;
        if (authHeader == null || authHeader.isEmpty()) {
            error = new ErrorResponse()
                    .error("MISSING_TOKEN")
                    .message("Authentication token is required")
                    .path(requestURI)
                    .status(401)
                    .timestamp(OffsetDateTime.now());
        } else {
            error = new ErrorResponse()
                    .error("INVALID_TOKEN")
                    .message("Invalid or expired authentication token")
                    .path(requestURI)
                    .status(401)
                    .timestamp(OffsetDateTime.now());
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
}
