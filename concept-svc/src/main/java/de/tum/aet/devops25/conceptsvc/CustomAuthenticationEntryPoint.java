package de.tum.aet.devops25.conceptsvc;

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

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {
        
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String authHeader = request.getHeader("Authorization");
        ErrorResponse error;
        
        if (authHeader == null || authHeader.isEmpty()) {
            error = new ErrorResponse()
                    .error("MISSING_TOKEN")
                    .message("Authentication token is required")
                    .path(request.getServletPath())
                    .status(401)
                    .timestamp(OffsetDateTime.now());
        } else {
            error = new ErrorResponse()
                    .error("INVALID_TOKEN")
                    .message("Invalid or expired authentication token")
                    .path(request.getServletPath())
                    .status(401)
                    .timestamp(OffsetDateTime.now());
        }

        objectMapper.writeValue(response.getOutputStream(), error);
    }
} 