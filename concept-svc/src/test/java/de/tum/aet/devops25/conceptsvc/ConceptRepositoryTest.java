package de.tum.aet.devops25.conceptsvc;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class ConceptRepositoryTest {

    @Autowired
    private ConceptRepository conceptRepository;

    @Test
    void testSaveAndFindConcept() {
        // Given
        ConceptEntity concept = new ConceptEntity();
        concept.setTitle("Test Concept");
        concept.setDescription("A test concept for unit testing");
        concept.setStatus(ConceptStatus.DRAFT);
        concept.setUserId(UUID.randomUUID());
        concept.setCreatedAt(OffsetDateTime.now());
        concept.setUpdatedAt(OffsetDateTime.now());
        concept.setLastModifiedBy(UUID.randomUUID());
        concept.setVersion(1);

        // When
        ConceptEntity saved = conceptRepository.save(concept);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTitle()).isEqualTo("Test Concept");
        assertThat(saved.getStatus()).isEqualTo(ConceptStatus.DRAFT);
        
        // Verify we can find by ID
        ConceptEntity found = conceptRepository.findById(saved.getId()).orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getTitle()).isEqualTo("Test Concept");
    }

    @Test
    void testFindByUserIdOrderByUpdatedAtDesc() {
        // Given
        UUID userId = UUID.randomUUID();
        
        ConceptEntity concept1 = createTestConcept("Concept 1", userId);
        ConceptEntity concept2 = createTestConcept("Concept 2", userId);
        
        conceptRepository.save(concept1);
        conceptRepository.save(concept2);

        // When
        var concepts = conceptRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        // Then
        assertThat(concepts).hasSize(2);
        assertThat(concepts.get(0).getTitle()).isIn("Concept 1", "Concept 2");
    }

    @Test
    void testFindByUserIdAndStatus() {
        // Given
        UUID userId = UUID.randomUUID();
        
        ConceptEntity draftConcept = createTestConcept("Draft Concept", userId);
        draftConcept.setStatus(ConceptStatus.DRAFT);
        
        ConceptEntity publishedConcept = createTestConcept("Published Concept", userId);
        publishedConcept.setStatus(ConceptStatus.COMPLETED);
        
        conceptRepository.save(draftConcept);
        conceptRepository.save(publishedConcept);

        // When
        var draftConcepts = conceptRepository.findByUserIdAndStatus(userId, ConceptStatus.DRAFT);
        var publishedConcepts = conceptRepository.findByUserIdAndStatus(userId, ConceptStatus.COMPLETED);

        // Then
        assertThat(draftConcepts).hasSize(1);
        assertThat(draftConcepts.get(0).getTitle()).isEqualTo("Draft Concept");
        assertThat(publishedConcepts).hasSize(1);
        assertThat(publishedConcepts.get(0).getTitle()).isEqualTo("Published Concept");
    }

    @Test
    void testFindByUserIdAndStatusOrderByUpdatedAtDesc_Paginated() {
        // Given
        UUID userId = UUID.randomUUID();
        
        ConceptEntity concept1 = createTestConcept("Concept 1", userId);
        concept1.setStatus(ConceptStatus.DRAFT);
        
        ConceptEntity concept2 = createTestConcept("Concept 2", userId);
        concept2.setStatus(ConceptStatus.DRAFT);
        
        conceptRepository.save(concept1);
        conceptRepository.save(concept2);

        // When
        var conceptsPage = conceptRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(
            userId, ConceptStatus.DRAFT, org.springframework.data.domain.PageRequest.of(0, 10));

        // Then
        assertThat(conceptsPage.getContent()).hasSize(2);
        assertThat(conceptsPage.getTotalElements()).isEqualTo(2);
        assertThat(conceptsPage.getTotalPages()).isEqualTo(1);
    }

    @Test
    void testFindByIdAndUserId() {
        // Given
        UUID userId = UUID.randomUUID();
        ConceptEntity concept = createTestConcept("Test Concept", userId);
        ConceptEntity saved = conceptRepository.save(concept);

        // When
        var found = conceptRepository.findByIdAndUserId(saved.getId(), userId);
        var notFound = conceptRepository.findByIdAndUserId(saved.getId(), UUID.randomUUID());

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("Test Concept");
        assertThat(notFound).isEmpty();
    }

    @Test
    void testFindByUserIdOrderByUpdatedAtDesc_EmptyResult() {
        // Given
        UUID userId = UUID.randomUUID();

        // When
        var concepts = conceptRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        // Then
        assertThat(concepts).isEmpty();
    }

    @Test
    void testFindByUserIdAndStatus_EmptyResult() {
        // Given
        UUID userId = UUID.randomUUID();

        // When
        var concepts = conceptRepository.findByUserIdAndStatus(userId, ConceptStatus.COMPLETED);

        // Then
        assertThat(concepts).isEmpty();
    }

    private ConceptEntity createTestConcept(String title, UUID userId) {
        ConceptEntity concept = new ConceptEntity();
        concept.setTitle(title);
        concept.setDescription("Test description");
        concept.setStatus(ConceptStatus.DRAFT);
        concept.setUserId(userId);
        concept.setCreatedAt(OffsetDateTime.now());
        concept.setUpdatedAt(OffsetDateTime.now());
        concept.setLastModifiedBy(userId);
        concept.setVersion(1);
        return concept;
    }
} 