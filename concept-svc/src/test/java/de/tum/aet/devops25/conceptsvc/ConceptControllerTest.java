package de.tum.aet.devops25.conceptsvc;

import static org.hamcrest.CoreMatchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import de.tum.aet.devops25.api.generated.model.CreateConceptRequest;
import de.tum.aet.devops25.api.generated.model.UpdateConceptRequest;
import de.tum.aet.devops25.api.generated.model.ApplyConceptSuggestionRequest;
import de.tum.aet.devops25.api.generated.model.ApplyConceptSuggestionRequestSuggestion;

@WebMvcTest(ConceptController.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("test")
class ConceptControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConceptRepository conceptRepository;

    @MockBean
    private PdfService pdfService;

    @Autowired
    private ObjectMapper objectMapper;

    private ConceptEntity testConcept;
    private UUID testUserId;
    private UUID testConceptId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        testConceptId = UUID.randomUUID();
        
        // Set up security context for each test
        TestingAuthenticationToken authentication = new TestingAuthenticationToken(testUserId.toString(), "password");
        authentication.setAuthenticated(true);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        
        testConcept = new ConceptEntity();
        testConcept.setId(testConceptId);
        testConcept.setTitle("Test Event Concept");
        testConcept.setDescription("Test description");
        testConcept.setStatus(ConceptStatus.DRAFT);
        testConcept.setUserId(testUserId);
        testConcept.setCreatedAt(OffsetDateTime.now());
        testConcept.setUpdatedAt(OffsetDateTime.now());
        testConcept.setLastModifiedBy(testUserId);
        testConcept.setVersion(1);
    }

    @Test
    @DisplayName("Should create concept successfully")
    void testCreateConcept_Success() throws Exception {
        // Given
        CreateConceptRequest request = new CreateConceptRequest();
        request.setTitle("New Event Concept");
        request.setDescription("New event description");

        given(conceptRepository.save(any(ConceptEntity.class))).willReturn(testConcept);

        // When & Then
        mockMvc.perform(post("/api/concepts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title", is(testConcept.getTitle())))
                .andExpect(jsonPath("$.description", is(testConcept.getDescription())));
    }

    @Test
    @DisplayName("Should return validation error for invalid request")
    void testCreateConcept_ValidationError() throws Exception {
        // Given
        CreateConceptRequest request = new CreateConceptRequest();
        // Missing required title

        // When & Then
        mockMvc.perform(post("/api/concepts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should get all user concepts with pagination")
    void testGetUserConcepts_Success() throws Exception {
        // Given
        List<ConceptEntity> concepts = List.of(testConcept);
        Page<ConceptEntity> conceptsPage = new PageImpl<>(concepts, PageRequest.of(0, 10), 1);
        given(conceptRepository.findByUserIdOrderByUpdatedAtDesc(any(UUID.class), any(Pageable.class)))
                .willReturn(conceptsPage);

        // When & Then
        mockMvc.perform(get("/api/concepts")
                .param("page", "0")
                .param("size", "10"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()", is(1)))
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].title", is(testConcept.getTitle())));
    }

    @Test
    @DisplayName("Should filter concepts by status")
    void testGetUserConcepts_WithStatusFilter() throws Exception {
        // Given
        List<ConceptEntity> concepts = new ArrayList<>();
        Page<ConceptEntity> conceptsPage = new PageImpl<>(concepts, PageRequest.of(0, 10), 0);
        given(conceptRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(any(UUID.class), eq(ConceptStatus.DRAFT), any(Pageable.class)))
                .willReturn(conceptsPage);

        // When & Then
        mockMvc.perform(get("/api/concepts")
                .param("page", "0")
                .param("size", "10")
                .param("status", "DRAFT"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()", is(0)));
    }

    @Test
    @DisplayName("Should get concept by ID successfully")
    void testGetConceptById_Success() throws Exception {
        // Given
        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.of(testConcept));

        // When & Then
        mockMvc.perform(get("/api/concepts/{conceptId}", testConceptId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(testConceptId.toString())))
                .andExpect(jsonPath("$.title", is(testConcept.getTitle())))
                .andExpect(jsonPath("$.description", is(testConcept.getDescription())));
    }

    @Test
    @DisplayName("Should return 404 when concept not found")
    void testGetConceptById_NotFound() throws Exception {
        // Given
        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/concepts/{conceptId}", testConceptId))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should update concept successfully")
    void testUpdateConcept_Success() throws Exception {
        // Given
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setTitle("Updated Title");
        request.setDescription("Updated Description");

        ConceptEntity updatedConcept = new ConceptEntity();
        updatedConcept.setId(testConceptId);
        updatedConcept.setTitle("Updated Title");
        updatedConcept.setDescription("Updated Description");
        updatedConcept.setStatus(ConceptStatus.DRAFT);
        updatedConcept.setUserId(testUserId);

        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.of(testConcept));
        given(conceptRepository.save(any(ConceptEntity.class))).willReturn(updatedConcept);

        // When & Then
        mockMvc.perform(put("/api/concepts/{conceptId}", testConceptId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Title")))
                .andExpect(jsonPath("$.description", is("Updated Description")));
    }

    @Test
    @DisplayName("Should return 404 when updating non-existent concept")
    void testUpdateConcept_NotFound() throws Exception {
        // Given
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setTitle("Updated Title");

        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.empty());

        // When & Then
        mockMvc.perform(put("/api/concepts/{conceptId}", testConceptId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should delete concept (soft delete) successfully")
    void testDeleteConcept_SoftDelete() throws Exception {
        // Given
        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.of(testConcept));
        given(conceptRepository.save(any(ConceptEntity.class))).willReturn(testConcept);

        // When & Then
        mockMvc.perform(delete("/api/concepts/{conceptId}", testConceptId)
                .param("permanent", "false"))
                .andDo(print())
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should delete concept (hard delete) successfully")
    void testDeleteConcept_HardDelete() throws Exception {
        // Given
        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.of(testConcept));
        willDoNothing().given(conceptRepository).delete(testConcept);

        // When & Then
        mockMvc.perform(delete("/api/concepts/{conceptId}", testConceptId)
                .param("permanent", "true"))
                .andDo(print())
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should return 404 when deleting non-existent concept")
    void testDeleteConcept_NotFound() throws Exception {
        // Given
        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.empty());

        // When & Then
        mockMvc.perform(delete("/api/concepts/{conceptId}", testConceptId))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should download concept PDF successfully")
    void testDownloadConceptPdf_Success() throws Exception {
        // Given
        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.of(testConcept));
        given(pdfService.generateConceptPdf(eq(testConcept)))
                .willReturn(new ByteArrayResource("PDF content".getBytes()));

        // When & Then
        mockMvc.perform(get("/api/concepts/{conceptId}/pdf", testConceptId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(header().exists("Content-Disposition"));
    }

    @Test
    @DisplayName("Should return 404 when downloading PDF for non-existent concept")
    void testDownloadConceptPdf_NotFound() throws Exception {
        // Given
        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/concepts/{conceptId}/pdf", testConceptId))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should handle PDF generation service error")
    void testDownloadConceptPdf_ServiceError() throws Exception {
        // Given
        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.of(testConcept));
        given(pdfService.generateConceptPdf(eq(testConcept)))
                .willThrow(new RuntimeException("PDF generation failed"));

        // When & Then
        mockMvc.perform(get("/api/concepts/{conceptId}/pdf", testConceptId))
                .andDo(print())
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("Should apply concept suggestion successfully")
    void testApplyConceptSuggestion_Success() throws Exception {
        // Given
        ApplyConceptSuggestionRequestSuggestion suggestion = new ApplyConceptSuggestionRequestSuggestion();
        suggestion.setTitle("Suggested Title");
        suggestion.setDescription("Suggested Description");
        
        ApplyConceptSuggestionRequest request = new ApplyConceptSuggestionRequest();
        request.setSuggestion(suggestion);
        request.setApplyMode(ApplyConceptSuggestionRequest.ApplyModeEnum.MERGE);
        request.setReasoning("Test reasoning");

        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.of(testConcept));
        given(conceptRepository.save(any(ConceptEntity.class))).willReturn(testConcept);

        // When & Then
        mockMvc.perform(post("/api/concepts/{conceptId}/apply-suggestion", testConceptId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should return 404 when applying suggestion to non-existent concept")
    void testApplyConceptSuggestion_NotFound() throws Exception {
        // Given
        ApplyConceptSuggestionRequestSuggestion suggestion = new ApplyConceptSuggestionRequestSuggestion();
        suggestion.setTitle("Suggested Title");
        suggestion.setDescription("Suggested Description");
        
        ApplyConceptSuggestionRequest request = new ApplyConceptSuggestionRequest();
        request.setSuggestion(suggestion);
        request.setApplyMode(ApplyConceptSuggestionRequest.ApplyModeEnum.MERGE);
        request.setReasoning("Test reasoning");

        given(conceptRepository.findByIdAndUserId(eq(testConceptId), any(UUID.class)))
                .willReturn(Optional.empty());

        // When & Then
        mockMvc.perform(post("/api/concepts/{conceptId}/apply-suggestion", testConceptId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return 400 for malformed JSON request")
    void testMalformedJsonRequest() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/concepts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ invalid json }"))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle large page size request")
    void testGetUserConcepts_LargePageSize() throws Exception {
        // Given
        Page<ConceptEntity> emptyPage = new PageImpl<>(new ArrayList<>(), PageRequest.of(0, 1000), 0);
        given(conceptRepository.findByUserIdOrderByUpdatedAtDesc(any(UUID.class), any(Pageable.class)))
                .willReturn(emptyPage);

        // When & Then
        mockMvc.perform(get("/api/concepts")
                .param("page", "0")
                .param("size", "1000"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }
} 