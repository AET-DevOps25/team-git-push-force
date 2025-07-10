package de.tum.aet.devops25.usersvc;

import java.time.OffsetDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import de.tum.aet.devops25.api.generated.controller.UserRegistrationApi;
import de.tum.aet.devops25.api.generated.model.RegisterUserRequest;
import de.tum.aet.devops25.api.generated.model.User;

@RestController
public class UserRegistrationController implements UserRegistrationApi {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public UserRegistrationController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public ResponseEntity<User> registerUser(RegisterUserRequest registerUserRequest) {
        // Check if user already exists
        if (userRepository.findByEmail(registerUserRequest.getEmail()).isPresent()) {
            return ResponseEntity.status(409).build(); // Conflict: user already exists
        }

        // Create and save new user
        UserEntity entity = new UserEntity();
        entity.setEmail(registerUserRequest.getEmail());
        entity.setFirstName(registerUserRequest.getFirstName());
        entity.setLastName(registerUserRequest.getLastName());
        entity.setActive(true);

        // Hash the password
        String hashedPassword = passwordEncoder.encode(registerUserRequest.getPassword());
        entity.setPasswordHash(hashedPassword);

        UserEntity saved = userRepository.save(entity);

        // Map to API User model
        User user = new User()
                .id(saved.getId())
                .email(saved.getEmail())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .isActive(saved.isActive())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now());

        return ResponseEntity.status(201).body(user);
    }

    @GetMapping("/api/users/profile")
    public String getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = (String) auth.getPrincipal();
        return "Your user ID from JWT: " + userId;
    }
}
