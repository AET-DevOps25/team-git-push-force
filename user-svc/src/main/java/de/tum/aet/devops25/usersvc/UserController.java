package de.tum.aet.devops25.usersvc;

import java.time.OffsetDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import de.tum.aet.devops25.api.generated.controller.UserRegistrationApi;
import de.tum.aet.devops25.api.generated.model.ErrorResponse;
import de.tum.aet.devops25.api.generated.model.RegisterUserRequest;
import de.tum.aet.devops25.api.generated.model.UpdateUserRequest;
import de.tum.aet.devops25.api.generated.model.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@RestController
public class UserController implements UserRegistrationApi {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private static final long EXPIRATION_TIME = 86400000; // 1 day in ms
    // Use a fixed, secure key (at least 32 characters for HS256)
    private static final String JWT_SECRET = "my-super-long-and-secure-secret-key-1234567890!@#$"; // 44+ chars

    @Autowired
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public ResponseEntity<User> registerUser(RegisterUserRequest registerUserRequest) {
        // Check if user already exists
        if (userRepository.findByEmail(registerUserRequest.getEmail()).isPresent()) {
            throw new UserAlreadyExistsException("User with this email already exists");
        }

        // Create and save new user
        UserEntity entity = new UserEntity();
        entity.setEmail(registerUserRequest.getEmail());
        entity.setFirstName(registerUserRequest.getFirstName());
        entity.setLastName(registerUserRequest.getLastName());
        entity.setActive(true);

        // Set timestamps
        OffsetDateTime now = OffsetDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        // Hash the password
        String hashedPassword = passwordEncoder.encode(registerUserRequest.getPassword());
        entity.setPasswordHash(hashedPassword);

        if (registerUserRequest.getPreferences() != null) {
            entity.setPreferences(UserPreferencesMapper.toEntity(registerUserRequest.getPreferences()));
        }

        UserEntity saved = userRepository.save(entity);

        // Map to API User model
        User user = new User()
                .id(saved.getId())
                .email(saved.getEmail())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .isActive(saved.isActive())
                .preferences(UserPreferencesMapper.toDto(saved.getPreferences()))
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt());

        return ResponseEntity.status(201).body(user);
    }

    @GetMapping("/")
    public String home() {
        return "Hello, this is the default screen!";
    }

    @GetMapping("/health")
    public Map<String, Object> getUserServiceHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", OffsetDateTime.now().toString());
        health.put("service", "user-service");

        try {
            // This will throw if DB is down
            long userCount = userRepository.count();
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
        }

        return health;
    }

    @PostMapping("/api/users/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<UserEntity> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        if (userOpt.isEmpty()) {
            ErrorResponse error = new ErrorResponse()
                    .error("INVALID_CREDENTIALS")
                    .message("Invalid email or password")
                    .path("/api/users/login")
                    .status(401)
                    .timestamp(OffsetDateTime.now());
            return ResponseEntity.status(401).body(error);
        }
        UserEntity user = userOpt.get();
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            ErrorResponse error = new ErrorResponse()
                    .error("INVALID_CREDENTIALS")
                    .message("Invalid email or password")
                    .path("/api/users/login")
                    .status(401)
                    .timestamp(OffsetDateTime.now());
            return ResponseEntity.status(401).body(error);
        }

        // Update lastLoginAt
        OffsetDateTime loginTime = OffsetDateTime.now();
        System.out.println("=== LOGIN DEBUG ===");
        System.out.println("Before update - lastLoginAt: " + user.getLastLoginAt());
        user.setLastLoginAt(loginTime);
        System.out.println("Setting lastLoginAt in database to: " + loginTime);
        UserEntity savedUser = userRepository.save(user);
        System.out.println("After save - lastLoginAt: " + savedUser.getLastLoginAt());
        System.out.println("=== END LOGIN DEBUG ===");

        // Generate JWT
        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes());
        String token = Jwts.builder()
                .setSubject(user.getId().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
        return ResponseEntity.ok(new LoginResponse(token));
    }

    @GetMapping("/api/users/profile")
    public ResponseEntity<?> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = (String) auth.getPrincipal();

        Optional<UserEntity> userOpt = userRepository.findById(UUID.fromString(userId));
        if (userOpt.isEmpty()) {
            ErrorResponse error = new ErrorResponse()
                    .error("USER_NOT_FOUND")
                    .message("User not found")
                    .path("/api/users/profile")
                    .status(404)
                    .timestamp(OffsetDateTime.now());
            return ResponseEntity.status(404).body(error);
        }

        UserEntity userEntity = userOpt.get();

        System.out.println("=== PROFILE DEBUG ===");
        System.out.println("Retrieved from DB - lastLoginAt: " + userEntity.getLastLoginAt());
        System.out.println("=== END PROFILE DEBUG ===");

        // Map to API User model
        User user = new User()
                .id(userEntity.getId())
                .email(userEntity.getEmail())
                .firstName(userEntity.getFirstName())
                .lastName(userEntity.getLastName())
                .isActive(userEntity.isActive())
                .preferences(UserPreferencesMapper.toDto(userEntity.getPreferences()))
                .createdAt(userEntity.getCreatedAt())
                .updatedAt(userEntity.getUpdatedAt());

        // Handle lastLoginAt properly using the correct method
        if (userEntity.getLastLoginAt() != null) {
            // Use the method that takes OffsetDateTime directly
            user.lastLoginAt(userEntity.getLastLoginAt());
            System.out.println("Setting lastLoginAt to: " + userEntity.getLastLoginAt());
        } else {
            System.out.println("lastLoginAt is null in entity");
        }

        return ResponseEntity.ok(user);
    }

    @PutMapping("/api/users/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateUserRequest updateRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = (String) authentication.getPrincipal();

        Optional<UserEntity> userOpt = userRepository.findById(UUID.fromString(userId));
        if (userOpt.isEmpty()) {
            ErrorResponse error = new ErrorResponse()
                    .error("USER_NOT_FOUND")
                    .message("User not found")
                    .path("/api/users/profile")
                    .status(404)
                    .timestamp(OffsetDateTime.now());
            return ResponseEntity.status(404).body(error);
        }
        UserEntity user = userOpt.get();

        // Update fields
        if (updateRequest.getFirstName() != null) {
            user.setFirstName(updateRequest.getFirstName());
        }
        if (updateRequest.getLastName() != null) {
            user.setLastName(updateRequest.getLastName());
        }
        if (updateRequest.getIsActive() != null) {
            user.setActive(updateRequest.getIsActive());
        }
        if (updateRequest.getPreferences() != null) {
            // Get existing preferences or create new ones
            UserPreferences existingPrefs = user.getPreferences();
            if (existingPrefs == null) {
                existingPrefs = new UserPreferences();
            }

            // Merge new preferences with existing ones (partial update)
            de.tum.aet.devops25.api.generated.model.UserPreferences newPrefs = updateRequest.getPreferences();

            if (newPrefs.getPreferredEventFormat() != null) {
                existingPrefs.setPreferredEventFormat(newPrefs.getPreferredEventFormat().getValue());
            }
            if (newPrefs.getIndustry() != null) {
                existingPrefs.setIndustry(newPrefs.getIndustry());
            }
            if (newPrefs.getLanguage() != null) {
                existingPrefs.setLanguage(newPrefs.getLanguage());
            }
            if (newPrefs.getTimezone() != null) {
                existingPrefs.setTimezone(newPrefs.getTimezone());
            }

            user.setPreferences(existingPrefs);
        }

        // Update the updatedAt timestamp
        user.setUpdatedAt(OffsetDateTime.now());

        // Add more fields as needed
        UserEntity savedUser = userRepository.save(user);

        // Map to API User model and return
        User userResponse = new User()
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .isActive(savedUser.isActive())
                .preferences(UserPreferencesMapper.toDto(savedUser.getPreferences()))
                .createdAt(savedUser.getCreatedAt())
                .updatedAt(savedUser.getUpdatedAt());

        // Handle lastLoginAt properly
        if (savedUser.getLastLoginAt() != null) {
            userResponse.lastLoginAt(savedUser.getLastLoginAt());
        }

        return ResponseEntity.ok(userResponse);
    }

    @PostMapping("/api/users/logout")
    public ResponseEntity<?> logout() {
        // For stateless JWT, just return 200 OK with a simple message
        return ResponseEntity.ok().body("Logged out successfully");
    }
}
