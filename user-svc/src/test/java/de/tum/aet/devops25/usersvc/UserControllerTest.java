package de.tum.aet.devops25.usersvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import de.tum.aet.devops25.api.generated.model.RegisterUserRequest;

@WebMvcTest(UserController.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private UserEntity testUser;
    private UUID testUserId;
    private OffsetDateTime testTimestamp;
    private BCryptPasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        testUserId = UUID.fromString(TestSecurityConfig.TEST_USER_ID);
        testTimestamp = OffsetDateTime.now();
        passwordEncoder = new BCryptPasswordEncoder();
        
        testUser = new UserEntity();
        testUser.setId(testUserId);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setActive(true);
        testUser.setPasswordHash(passwordEncoder.encode("password123"));
        testUser.setCreatedAt(testTimestamp);
        testUser.setUpdatedAt(testTimestamp);
        testUser.setLastLoginAt(testTimestamp);
        
        UserPreferences preferences = new UserPreferences();
        preferences.setPreferredEventFormat("VIRTUAL");
        preferences.setIndustry("Technology");
        preferences.setLanguage("en");
        preferences.setTimezone("UTC");
        testUser.setPreferences(preferences);
    }

    @Test
    @DisplayName("Should register user successfully")
    void testRegisterUser_Success() throws Exception {
        RegisterUserRequest request = new RegisterUserRequest();
        request.setEmail("newuser@example.com");
        request.setFirstName("Jane");
        request.setLastName("Smith");
        request.setPassword("password123");

        when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.isActive").value(true));

        verify(userRepository).findByEmail("newuser@example.com");
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should return error when user already exists")
    void testRegisterUser_UserAlreadyExists() throws Exception {
        RegisterUserRequest request = new RegisterUserRequest();
        request.setEmail("existing@example.com");
        request.setFirstName("Jane");
        request.setLastName("Smith");
        request.setPassword("password123");

        when(userRepository.findByEmail("existing@example.com")).thenReturn(Optional.of(testUser));

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("USER_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.message").value("User with this email already exists"));

        verify(userRepository).findByEmail("existing@example.com");
    }

    @Test
    @DisplayName("Should return home page")
    void testHome() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().string("Hello, this is the default screen!"));
    }

    @Test
    @DisplayName("Should return health status")
    void testGetUserServiceHealth() throws Exception {
        when(userRepository.count()).thenReturn(5L);

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("user-service"))
                .andExpect(jsonPath("$.database").value("UP"));

        verify(userRepository).count();
    }

    @Test
    @DisplayName("Should return health status with database down")
    void testGetUserServiceHealth_DatabaseDown() throws Exception {
        when(userRepository.count()).thenThrow(new RuntimeException("Database connection failed"));

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("user-service"))
                .andExpect(jsonPath("$.database").value("DOWN"));

        verify(userRepository).count();
    }

    @Test
    @DisplayName("Should login successfully")
    void testLogin_Success() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        verify(userRepository).findByEmail("test@example.com");
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should return error for invalid email")
    void testLogin_InvalidEmail() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nonexistent@example.com");
        loginRequest.setPassword("password123");

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        verify(userRepository).findByEmail("nonexistent@example.com");
    }

    @Test
    @DisplayName("Should return error for invalid password")
    void testLogin_InvalidPassword() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("wrongpassword");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    @DisplayName("Should get user profile successfully")
    void testGetProfile_Success() throws Exception {
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testUserId.toString()))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.preferences.preferredEventFormat").value("VIRTUAL"))
                .andExpect(jsonPath("$.preferences.industry").value("Technology"));

        verify(userRepository).findById(testUserId);
    }

    @Test
    @DisplayName("Should return 404 when user not found for profile")
    void testGetProfile_UserNotFound() throws Exception {
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("USER_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("User not found"));

        verify(userRepository).findById(testUserId);
    }

    @Test
    @DisplayName("Should update user profile successfully")
    void testUpdateProfile_Success() throws Exception {
        de.tum.aet.devops25.api.generated.model.UpdateUserRequest updateRequest = 
            new de.tum.aet.devops25.api.generated.model.UpdateUserRequest();
        updateRequest.setFirstName("UpdatedJohn");
        updateRequest.setLastName("UpdatedDoe");

        // Create updated user entity to return from save
        UserEntity updatedUser = new UserEntity();
        updatedUser.setId(testUserId);
        updatedUser.setEmail("test@example.com"); // Email field isn't updated in controller
        updatedUser.setFirstName("UpdatedJohn");
        updatedUser.setLastName("UpdatedDoe");
        updatedUser.setActive(true);
        updatedUser.setCreatedAt(testTimestamp);
        updatedUser.setUpdatedAt(testTimestamp);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(updatedUser);

        mockMvc.perform(put("/api/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("UpdatedJohn"))
                .andExpect(jsonPath("$.lastName").value("UpdatedDoe"));

        verify(userRepository).findById(testUserId);
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should return 404 when updating non-existent user")
    void testUpdateProfile_UserNotFound() throws Exception {
        de.tum.aet.devops25.api.generated.model.UpdateUserRequest updateRequest = 
            new de.tum.aet.devops25.api.generated.model.UpdateUserRequest();
        updateRequest.setFirstName("UpdatedJohn");

        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("USER_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("User not found"));

        verify(userRepository).findById(testUserId);
    }

    @Test
    @DisplayName("Should logout successfully")
    void testLogout() throws Exception {
        mockMvc.perform(post("/api/users/logout"))
                .andExpect(status().isOk())
                .andExpect(content().string("Logged out successfully"));
    }

    @Test
    @DisplayName("Should handle malformed JSON gracefully")
    void testMalformedJson() throws Exception {
        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ invalid json }"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should register user with preferences successfully")
    void testRegisterUser_WithPreferences() throws Exception {
        de.tum.aet.devops25.api.generated.model.UserPreferences prefs = 
            new de.tum.aet.devops25.api.generated.model.UserPreferences();
        prefs.setPreferredEventFormat(de.tum.aet.devops25.api.generated.model.UserPreferences.PreferredEventFormatEnum.HYBRID);
        prefs.setIndustry("Finance");
        prefs.setLanguage("de");
        prefs.setTimezone("CET");

        RegisterUserRequest request = new RegisterUserRequest();
        request.setEmail("newuser@example.com");
        request.setFirstName("Jane");
        request.setLastName("Smith");
        request.setPassword("password123");
        request.setPreferences(prefs);

        when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(userRepository).findByEmail("newuser@example.com");
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should get profile with null lastLoginAt")
    void testGetProfile_NullLastLoginAt() throws Exception {
        // Create user without lastLoginAt
        UserEntity userWithoutLogin = new UserEntity();
        userWithoutLogin.setId(testUserId);
        userWithoutLogin.setEmail("test@example.com");
        userWithoutLogin.setFirstName("John");
        userWithoutLogin.setLastName("Doe");
        userWithoutLogin.setActive(true);
        userWithoutLogin.setCreatedAt(testTimestamp);
        userWithoutLogin.setUpdatedAt(testTimestamp);
        userWithoutLogin.setLastLoginAt(null); // Explicitly null
        userWithoutLogin.setPreferences(testUser.getPreferences());

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(userWithoutLogin));

        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testUserId.toString()))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"));

        verify(userRepository).findById(testUserId);
    }

    @Test
    @DisplayName("Should update profile with null preferences in existing user")
    void testUpdateProfile_NullExistingPreferences() throws Exception {
        // Create user without preferences
        UserEntity userWithoutPrefs = new UserEntity();
        userWithoutPrefs.setId(testUserId);
        userWithoutPrefs.setEmail("test@example.com");
        userWithoutPrefs.setFirstName("John");
        userWithoutPrefs.setLastName("Doe");
        userWithoutPrefs.setActive(true);
        userWithoutPrefs.setCreatedAt(testTimestamp);
        userWithoutPrefs.setUpdatedAt(testTimestamp);
        userWithoutPrefs.setPreferences(null); // Explicitly null

        de.tum.aet.devops25.api.generated.model.UserPreferences newPrefs = 
            new de.tum.aet.devops25.api.generated.model.UserPreferences();
        newPrefs.setPreferredEventFormat(de.tum.aet.devops25.api.generated.model.UserPreferences.PreferredEventFormatEnum.HYBRID);
        newPrefs.setIndustry("Finance");

        de.tum.aet.devops25.api.generated.model.UpdateUserRequest updateRequest = 
            new de.tum.aet.devops25.api.generated.model.UpdateUserRequest();
        updateRequest.setPreferences(newPrefs);

        UserEntity updatedUser = new UserEntity();
        updatedUser.setId(testUserId);
        updatedUser.setEmail("test@example.com");
        updatedUser.setFirstName("John");
        updatedUser.setLastName("Doe");
        updatedUser.setActive(true);
        updatedUser.setCreatedAt(testTimestamp);
        updatedUser.setUpdatedAt(testTimestamp);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(userWithoutPrefs));
        when(userRepository.save(any(UserEntity.class))).thenReturn(updatedUser);

        mockMvc.perform(put("/api/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());

        verify(userRepository).findById(testUserId);
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should update profile with partial preference updates")
    void testUpdateProfile_PartialPreferenceUpdate() throws Exception {
        de.tum.aet.devops25.api.generated.model.UserPreferences partialPrefs = 
            new de.tum.aet.devops25.api.generated.model.UserPreferences();
        partialPrefs.setIndustry("Healthcare"); // Only update industry
        // Leave other fields null to test null checks

        de.tum.aet.devops25.api.generated.model.UpdateUserRequest updateRequest = 
            new de.tum.aet.devops25.api.generated.model.UpdateUserRequest();
        updateRequest.setPreferences(partialPrefs);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        mockMvc.perform(put("/api/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());

        verify(userRepository).findById(testUserId);
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should update profile with isActive field")
    void testUpdateProfile_WithIsActive() throws Exception {
        de.tum.aet.devops25.api.generated.model.UpdateUserRequest updateRequest = 
            new de.tum.aet.devops25.api.generated.model.UpdateUserRequest();
        updateRequest.setIsActive(false);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        mockMvc.perform(put("/api/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());

        verify(userRepository).findById(testUserId);
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should update profile with all null fields (no changes)")
    void testUpdateProfile_AllNullFields() throws Exception {
        de.tum.aet.devops25.api.generated.model.UpdateUserRequest updateRequest = 
            new de.tum.aet.devops25.api.generated.model.UpdateUserRequest();
        // All fields are null, should only update timestamp

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        mockMvc.perform(put("/api/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());

        verify(userRepository).findById(testUserId);
        verify(userRepository).save(any(UserEntity.class));
    }
} 