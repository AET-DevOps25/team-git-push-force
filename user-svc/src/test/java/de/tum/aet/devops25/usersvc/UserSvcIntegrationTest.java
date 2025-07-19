package de.tum.aet.devops25.usersvc;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class UserSvcIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserController userController;

    @Autowired
    private GlobalExceptionHandler globalExceptionHandler;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @Test
    void contextLoads() {
        // Verify that all required beans are loaded
        assertThat(userRepository).isNotNull();
        assertThat(userController).isNotNull();
        assertThat(globalExceptionHandler).isNotNull();
        assertThat(jwtAuthenticationFilter).isNotNull();
        assertThat(customAuthenticationEntryPoint).isNotNull();
    }

    @Test
    void testDatabaseIntegration() {
        // Test basic database operations
        UserEntity user = new UserEntity();
        user.setEmail("integration@test.com");
        user.setFirstName("Integration");
        user.setLastName("Test");
        user.setActive(true);
        user.setPasswordHash("hashedpassword");
        
        OffsetDateTime now = OffsetDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        // Save user
        UserEntity savedUser = userRepository.save(user);
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getEmail()).isEqualTo("integration@test.com");

        // Find by email
        var foundUser = userRepository.findByEmail("integration@test.com");
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getFirstName()).isEqualTo("Integration");

        // Cleanup
        userRepository.delete(savedUser);
    }

    @Test
    void testUserPreferencesIntegration() {
        // Test user with preferences
        UserEntity user = new UserEntity();
        user.setEmail("prefs@test.com");
        user.setFirstName("Prefs");
        user.setLastName("User");
        user.setActive(true);
        user.setPasswordHash("hashedpassword");
        
        OffsetDateTime now = OffsetDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        // Add preferences
        UserPreferences preferences = new UserPreferences();
        preferences.setPreferredEventFormat("VIRTUAL");
        preferences.setIndustry("Technology");
        preferences.setLanguage("en");
        preferences.setTimezone("UTC");
        user.setPreferences(preferences);

        // Save and verify
        UserEntity savedUser = userRepository.save(user);
        assertThat(savedUser.getPreferences()).isNotNull();
        assertThat(savedUser.getPreferences().getPreferredEventFormat()).isEqualTo("VIRTUAL");
        assertThat(savedUser.getPreferences().getIndustry()).isEqualTo("Technology");

        // Find and verify preferences persist
        var foundUser = userRepository.findById(savedUser.getId());
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getPreferences()).isNotNull();
        assertThat(foundUser.get().getPreferences().getPreferredEventFormat()).isEqualTo("VIRTUAL");

        // Cleanup
        userRepository.delete(savedUser);
    }

    @Test
    void testRepositoryCount() {
        long initialCount = userRepository.count();
        
        // Add test users
        UserEntity user1 = createTestUser("count1@test.com", "Count", "One");
        UserEntity user2 = createTestUser("count2@test.com", "Count", "Two");
        
        userRepository.save(user1);
        userRepository.save(user2);
        
        long newCount = userRepository.count();
        assertThat(newCount).isEqualTo(initialCount + 2);
        
        // Cleanup
        userRepository.delete(user1);
        userRepository.delete(user2);
    }

    private UserEntity createTestUser(String email, String firstName, String lastName) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setActive(true);
        user.setPasswordHash("hashedpassword");
        
        OffsetDateTime now = OffsetDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        
        return user;
    }
} 