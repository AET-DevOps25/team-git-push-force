package de.tum.aet.devops25.conceptsvc;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
class PdfServiceTest {

    private PdfService pdfService;
    private ConceptEntity testConcept;

    @BeforeEach
    void setUp() {
        pdfService = new PdfService();
        
        testConcept = new ConceptEntity();
        testConcept.setId(UUID.randomUUID());
        testConcept.setTitle("Test Event Concept");
        testConcept.setDescription("A comprehensive test event concept for PDF generation");
        testConcept.setStatus(ConceptStatus.DRAFT);
        testConcept.setUserId(UUID.randomUUID());
        testConcept.setCreatedAt(OffsetDateTime.now().minusDays(1));
        testConcept.setUpdatedAt(OffsetDateTime.now());
        testConcept.setLastModifiedBy(UUID.randomUUID());
        testConcept.setVersion(1);
    }

    @Test
    void testGenerateConceptPdf_BasicConcept() throws Exception {
        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        assertThat(pdfResource).isNotNull();
        assertThat(pdfResource.exists()).isTrue();
        
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).contains("=== CONCEPT PDF REPORT ===");
        assertThat(content).contains("Title: Test Event Concept");
        assertThat(content).contains("Description: A comprehensive test event concept for PDF generation");
        assertThat(content).contains("Status: DRAFT");
        assertThat(content).contains("Created:");
        assertThat(content).contains("Updated:");
        assertThat(content).contains("Generated at:");
    }

    @Test
    void testGenerateConceptPdf_WithEventDetails() throws Exception {
        // Given
        EventDetailsEntity eventDetails = new EventDetailsEntity();
        eventDetails.setTheme("Technology Conference");
        eventDetails.setFormat(EventFormat.HYBRID);
        eventDetails.setCapacity(500);
        eventDetails.setDuration("2 days");
        testConcept.setEventDetails(eventDetails);

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).contains("=== EVENT DETAILS ===");
        assertThat(content).contains("Theme: Technology Conference");
        assertThat(content).contains("Format: HYBRID");
        assertThat(content).contains("Capacity: 500");
        assertThat(content).contains("Duration: 2 days");
    }

    @Test
    void testGenerateConceptPdf_WithAgenda() throws Exception {
        // Given
        AgendaItemEntity agendaItem1 = new AgendaItemEntity();
        agendaItem1.setTime("09:00");
        agendaItem1.setTitle("Opening Keynote");
        agendaItem1.setType(AgendaItemType.KEYNOTE);

        AgendaItemEntity agendaItem2 = new AgendaItemEntity();
        agendaItem2.setTime("10:30");
        agendaItem2.setTitle("Technical Workshop");
        agendaItem2.setType(AgendaItemType.WORKSHOP);

        testConcept.setAgenda(List.of(agendaItem1, agendaItem2));

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).contains("=== AGENDA ===");
        assertThat(content).contains("- 09:00: Opening Keynote");
        assertThat(content).contains("- 10:30: Technical Workshop");
    }

    @Test
    void testGenerateConceptPdf_WithSpeakers() throws Exception {
        // Given
        SpeakerEntity speaker1 = new SpeakerEntity();
        speaker1.setName("Dr. Jane Smith");
        speaker1.setExpertise("AI Research");

        SpeakerEntity speaker2 = new SpeakerEntity();
        speaker2.setName("John Doe");
        speaker2.setExpertise("Software Engineering");

        testConcept.setSpeakers(List.of(speaker1, speaker2));

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).contains("=== SPEAKERS ===");
        assertThat(content).contains("- Dr. Jane Smith (AI Research)");
        assertThat(content).contains("- John Doe (Software Engineering)");
    }

    @Test
    void testGenerateConceptPdf_WithNullDescription() throws Exception {
        // Given
        testConcept.setDescription(null);

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).contains("Description: N/A");
    }

    @Test
    void testGenerateConceptPdf_WithNullEventDetails() throws Exception {
        // Given
        testConcept.setEventDetails(null);

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).doesNotContain("=== EVENT DETAILS ===");
    }

    @Test
    void testGenerateConceptPdf_WithEmptyAgenda() throws Exception {
        // Given
        testConcept.setAgenda(List.of());

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).doesNotContain("=== AGENDA ===");
    }

    @Test
    void testGenerateConceptPdf_WithEmptySpeakers() throws Exception {
        // Given
        testConcept.setSpeakers(List.of());

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).doesNotContain("=== SPEAKERS ===");
    }

    @Test
    void testGenerateConceptPdf_CompleteConceptWithAllSections() throws Exception {
        // Given - Full concept with all components
        EventDetailsEntity eventDetails = new EventDetailsEntity();
        eventDetails.setTheme("Innovation Summit");
        eventDetails.setFormat(EventFormat.PHYSICAL);
        eventDetails.setCapacity(200);
        testConcept.setEventDetails(eventDetails);

        AgendaItemEntity agendaItem = new AgendaItemEntity();
        agendaItem.setTime("14:00");
        agendaItem.setTitle("Panel Discussion");
        testConcept.setAgenda(List.of(agendaItem));

        SpeakerEntity speaker = new SpeakerEntity();
        speaker.setName("Prof. Alice Johnson");
        speaker.setExpertise("Innovation Management");
        testConcept.setSpeakers(List.of(speaker));

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).contains("=== CONCEPT PDF REPORT ===");
        assertThat(content).contains("=== EVENT DETAILS ===");
        assertThat(content).contains("=== AGENDA ===");
        assertThat(content).contains("=== SPEAKERS ===");
        assertThat(content).contains("=== END OF REPORT ===");
    }

    @Test
    void testGenerateConceptPdf_WithPartialEventDetails() throws Exception {
        // Given - EventDetails with some null fields
        EventDetailsEntity eventDetails = new EventDetailsEntity();
        eventDetails.setTheme(null);
        eventDetails.setFormat(null);
        eventDetails.setCapacity(null);
        eventDetails.setDuration(null);
        testConcept.setEventDetails(eventDetails);

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).contains("=== EVENT DETAILS ===");
        assertThat(content).contains("Theme: N/A");
        assertThat(content).contains("Format: N/A");
        assertThat(content).contains("Capacity: N/A");
        assertThat(content).contains("Duration: N/A");
    }

    @Test
    void testGenerateConceptPdf_WithNullAgenda() throws Exception {
        // Given
        testConcept.setAgenda(null);

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).doesNotContain("=== AGENDA ===");
    }

    @Test
    void testGenerateConceptPdf_WithNullSpeakers() throws Exception {
        // Given
        testConcept.setSpeakers(null);

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).doesNotContain("=== SPEAKERS ===");
    }

    @Test
    void testGenerateConceptPdf_WithSpeakerNullExpertise() throws Exception {
        // Given
        SpeakerEntity speaker = new SpeakerEntity();
        speaker.setName("Speaker Name");
        speaker.setExpertise(null);
        testConcept.setSpeakers(List.of(speaker));

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String content = new String(pdfResource.getInputStream().readAllBytes());
        assertThat(content).contains("=== SPEAKERS ===");
        assertThat(content).contains("- Speaker Name (N/A)");
    }
} 