package de.tum.aet.devops25.usersvc;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void testSaveAndFindUser() {
        // Create test user
        UserEntity user = createTestUser("test@example.com", "John", "Doe");
        
        // Save user
        UserEntity savedUser = userRepository.save(user);
        
        // Verify save
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getEmail()).isEqualTo("test@example.com");
        assertThat(savedUser.getFirstName()).isEqualTo("John");
        assertThat(savedUser.getLastName()).isEqualTo("Doe");
        assertThat(savedUser.isActive()).isTrue();
        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUpdatedAt()).isNotNull();
        
        // Find by ID
        Optional<UserEntity> foundUser = userRepository.findById(savedUser.getId());
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void testFindByEmail() {
        // Create and save test user
        UserEntity user = createTestUser("findme@example.com", "Jane", "Smith");
        userRepository.save(user);
        
        // Find by email
        Optional<UserEntity> foundUser = userRepository.findByEmail("findme@example.com");
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getFirstName()).isEqualTo("Jane");
        assertThat(foundUser.get().getLastName()).isEqualTo("Smith");
    }

    @Test
    void testFindByEmail_NotFound() {
        // Try to find non-existent user
        Optional<UserEntity> foundUser = userRepository.findByEmail("nonexistent@example.com");
        assertThat(foundUser).isEmpty();
    }

    @Test
    void testUserWithPreferences() {
        // Create user with preferences
        UserEntity user = createTestUser("prefs@example.com", "User", "WithPrefs");
        
        UserPreferences preferences = new UserPreferences();
        preferences.setPreferredEventFormat("HYBRID");
        preferences.setIndustry("Healthcare");
        preferences.setLanguage("en");
        preferences.setTimezone("UTC");
        user.setPreferences(preferences);
        
        // Save and retrieve
        UserEntity savedUser = userRepository.save(user);
        Optional<UserEntity> foundUser = userRepository.findById(savedUser.getId());
        
        // Verify preferences
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getPreferences()).isNotNull();
        assertThat(foundUser.get().getPreferences().getPreferredEventFormat()).isEqualTo("HYBRID");
        assertThat(foundUser.get().getPreferences().getIndustry()).isEqualTo("Healthcare");
        assertThat(foundUser.get().getPreferences().getLanguage()).isEqualTo("en");
        assertThat(foundUser.get().getPreferences().getTimezone()).isEqualTo("UTC");
    }

    @Test
    void testLastLoginAtUpdate() {
        // Create user
        UserEntity user = createTestUser("login@example.com", "Login", "User");
        UserEntity savedUser = userRepository.save(user);
        
        // Update last login
        OffsetDateTime loginTime = OffsetDateTime.now();
        savedUser.setLastLoginAt(loginTime);
        userRepository.save(savedUser);
        
        // Verify update
        Optional<UserEntity> foundUser = userRepository.findById(savedUser.getId());
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getLastLoginAt()).isNotNull();
    }

    @Test
    void testEmailUniqueness() {
        // Create first user
        UserEntity user1 = createTestUser("unique@example.com", "First", "User");
        userRepository.save(user1);
        
        // Try to create second user with same email
        UserEntity user2 = createTestUser("unique@example.com", "Second", "User");
        
        // This should throw a constraint violation exception
        org.junit.jupiter.api.Assertions.assertThrows(
            org.springframework.dao.DataIntegrityViolationException.class, 
            () -> {
                userRepository.save(user2);
                userRepository.flush(); // Force the constraint check
            }
        );
    }

    @Test
    void testUserCount() {
        // Count initial users
        long initialCount = userRepository.count();
        
        // Add users
        userRepository.save(createTestUser("count1@example.com", "Count", "One"));
        userRepository.save(createTestUser("count2@example.com", "Count", "Two"));
        
        // Verify count
        long newCount = userRepository.count();
        assertThat(newCount).isEqualTo(initialCount + 2);
    }

    private UserEntity createTestUser(String email, String firstName, String lastName) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setActive(true);
        user.setPasswordHash("hashed_password");
        
        OffsetDateTime now = OffsetDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        
        return user;
    }
} 