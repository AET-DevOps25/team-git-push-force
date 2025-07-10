package de.tum.aet.devops25.usersvc;

import java.time.OffsetDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Autowired;
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
import de.tum.aet.devops25.api.generated.model.RegisterUserRequest;
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
            return ResponseEntity.status(409).build(); // Conflict: user already exists
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
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        Optional<UserEntity> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        UserEntity user = userOpt.get();
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(401).build();
        }

        // Update lastLoginAt
        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);

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
    public ResponseEntity<User> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = (String) auth.getPrincipal();

        Optional<UserEntity> userOpt = userRepository.findById(UUID.fromString(userId));
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }

        UserEntity userEntity = userOpt.get();

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

        return ResponseEntity.ok(user);
    }

    @PutMapping("/api/users/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateUserRequest updateRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = (String) authentication.getPrincipal();

        Optional<UserEntity> userOpt = userRepository.findById(UUID.fromString(userId));
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }
        UserEntity user = userOpt.get();

        // Update fields
        if (updateRequest.getFirstName() != null) {
            user.setFirstName(updateRequest.getFirstName());
        }
        if (updateRequest.getLastName() != null) {
            user.setLastName(updateRequest.getLastName());
        }
        if (updateRequest.getEmail() != null) {
            user.setEmail(updateRequest.getEmail());
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
        userRepository.save(user);

        return ResponseEntity.ok("Profile updated successfully");
    }

    @PostMapping("/api/users/logout")
    public ResponseEntity<?> logout() {
        // For stateless JWT, just return 200 OK.
        return ResponseEntity.ok("Logged out successfully");
    }
}
