package de.tum.aet.devops25.conceptsvc;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.test.context.ActiveProfiles;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;

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
        assertThat(pdfResource.contentLength()).isGreaterThan(0);
        
        // Verify it's a valid PDF by extracting text
        String pdfText = extractTextFromPdf(pdfResource);
        assertThat(pdfText).contains("Test Event Concept");
        assertThat(pdfText).contains("Event Concept Document");
        assertThat(pdfText).contains("DRAFT");
        assertThat(pdfText).contains("A comprehensive test event concept for PDF generation");
    }

    @Test
    void testGenerateConceptPdf_WithEventDetails() throws Exception {
        // Given
        EventDetailsEntity eventDetails = new EventDetailsEntity();
        eventDetails.setTheme("Technology Conference");
        eventDetails.setFormat(EventFormat.HYBRID);
        eventDetails.setCapacity(500);
        eventDetails.setDuration("2 days");
        eventDetails.setStartDate(LocalDate.of(2024, 6, 15));
        eventDetails.setEndDate(LocalDate.of(2024, 6, 16));
        eventDetails.setLocation("Munich Conference Center");
        eventDetails.setTargetAudience("Software developers and IT professionals");
        eventDetails.setObjectives(List.of("Share latest tech trends", "Network with peers", "Learn new skills"));
        testConcept.setEventDetails(eventDetails);

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String pdfText = extractTextFromPdf(pdfResource);
        assertThat(pdfText).contains("Event Details");
        assertThat(pdfText).contains("Technology Conference");
        assertThat(pdfText).contains("HYBRID");
        assertThat(pdfText).contains("500 attendees");
        assertThat(pdfText).contains("2 days");
        assertThat(pdfText).contains("Munich Conference Center");
        assertThat(pdfText).contains("Software developers and IT professionals");
        assertThat(pdfText).contains("Event Objectives");
        assertThat(pdfText).contains("Share latest tech trends");
    }

    @Test
    void testGenerateConceptPdf_WithAgenda() throws Exception {
        // Given
        AgendaItemEntity agendaItem1 = new AgendaItemEntity();
        agendaItem1.setTime("09:00");
        agendaItem1.setTitle("Opening Keynote");
        agendaItem1.setDescription("Welcome and overview of the conference");
        agendaItem1.setType(AgendaItemType.KEYNOTE);
        agendaItem1.setSpeaker("Dr. John Smith");

        AgendaItemEntity agendaItem2 = new AgendaItemEntity();
        agendaItem2.setTime("10:30");
        agendaItem2.setTitle("Technical Workshop");
        agendaItem2.setDescription("Hands-on coding session");
        agendaItem2.setType(AgendaItemType.WORKSHOP);
        agendaItem2.setSpeaker("Jane Doe");

        testConcept.setAgenda(List.of(agendaItem1, agendaItem2));

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String pdfText = extractTextFromPdf(pdfResource);
        assertThat(pdfText).contains("Event Agenda");
        assertThat(pdfText).contains("09:00");
        assertThat(pdfText).contains("Opening Keynote");
        assertThat(pdfText).contains("Welcome and overview");
        assertThat(pdfText).contains("KEYNOTE");
        assertThat(pdfText).contains("Dr. John Smith");
        assertThat(pdfText).contains("10:30");
        assertThat(pdfText).contains("Technical Workshop");
        assertThat(pdfText).contains("WORKSHOP");
        assertThat(pdfText).contains("Jane Doe");
    }

    @Test
    void testGenerateConceptPdf_WithSpeakers() throws Exception {
        // Given
        SpeakerEntity speaker1 = new SpeakerEntity();
        speaker1.setName("Dr. John Smith");
        speaker1.setExpertise("AI and Machine Learning");
        speaker1.setBio("Leading expert in artificial intelligence with 15 years of experience.");
        speaker1.setSuggestedTopic("Future of AI in Business");
        speaker1.setConfirmed(true);

        SpeakerEntity speaker2 = new SpeakerEntity();
        speaker2.setName("Jane Doe");
        speaker2.setExpertise("Software Architecture");
        speaker2.setBio("Principal architect at major tech company.");
        speaker2.setSuggestedTopic("Microservices Best Practices");

        testConcept.setSpeakers(List.of(speaker1, speaker2));

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String pdfText = extractTextFromPdf(pdfResource);
        assertThat(pdfText).contains("Speaker Information");
        assertThat(pdfText).contains("Dr. John Smith");
        assertThat(pdfText).contains("AI and Machine Learning");
        assertThat(pdfText).contains("Leading expert in artificial intelligence");
        assertThat(pdfText).contains("Future of AI in Business");
        assertThat(pdfText).contains("Jane Doe");
        assertThat(pdfText).contains("Software Architecture");
        assertThat(pdfText).contains("Microservices Best Practices");
    }

    @Test
    void testGenerateConceptPdf_WithPricing() throws Exception {
        // Given
        PricingEntity pricing = new PricingEntity();
        pricing.setCurrency("EUR");
        pricing.setEarlyBird(new BigDecimal("199.00"));
        pricing.setRegular(new BigDecimal("299.00"));
        pricing.setVip(new BigDecimal("499.00"));
        pricing.setStudent(new BigDecimal("99.00"));
        pricing.setGroup(new BigDecimal("249.00"));
        testConcept.setPricing(pricing);

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String pdfText = extractTextFromPdf(pdfResource);
        assertThat(pdfText).contains("Ticket Pricing");
        assertThat(pdfText).contains("EUR 199.00");
        assertThat(pdfText).contains("EUR 299.00");
        assertThat(pdfText).contains("EUR 499.00");
        assertThat(pdfText).contains("EUR 99.00");
        assertThat(pdfText).contains("EUR 249.00");
        assertThat(pdfText).contains("Early Bird");
        assertThat(pdfText).contains("Regular");
        assertThat(pdfText).contains("VIP");
        assertThat(pdfText).contains("Student");
        assertThat(pdfText).contains("Group");
    }

    @Test
    void testGenerateConceptPdf_WithNotes() throws Exception {
        // Given
        testConcept.setNotes("Special requirements: \n- Wheelchair accessible venue\n- Dietary restrictions catering\n- Live streaming setup needed");

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String pdfText = extractTextFromPdf(pdfResource);
        assertThat(pdfText).contains("Additional Notes");
        assertThat(pdfText).contains("Special requirements");
        assertThat(pdfText).contains("Wheelchair accessible");
        assertThat(pdfText).contains("Live streaming setup");
    }

    @Test
    void testGenerateConceptPdf_WithTags() throws Exception {
        // Given
        testConcept.setTags(List.of("technology", "innovation", "networking", "professional-development"));

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        String pdfText = extractTextFromPdf(pdfResource);
        assertThat(pdfText).contains("Tags");
        assertThat(pdfText).contains("technology");
        assertThat(pdfText).contains("innovation");
        assertThat(pdfText).contains("networking");
        assertThat(pdfText).contains("professional-development");
    }

    @Test
    void testGenerateConceptPdf_CompleteConceptWithAllSections() throws Exception {
        // Given - Create a complete concept with all possible data
        setupCompleteTestConcept();

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        assertThat(pdfResource).isNotNull();
        assertThat(pdfResource.exists()).isTrue();
        assertThat(pdfResource.contentLength()).isGreaterThan(1000); // Should be substantial PDF
        
        String pdfText = extractTextFromPdf(pdfResource);
        
        // Verify main sections are present
        assertThat(pdfText).contains("Event Concept Document");
        assertThat(pdfText).contains("Event Details");
        assertThat(pdfText).contains("Event Agenda");
        assertThat(pdfText).contains("Speaker Information");
        assertThat(pdfText).contains("Ticket Pricing");
        assertThat(pdfText).contains("Additional Notes");
        assertThat(pdfText).contains("Tags");
        assertThat(pdfText).contains("Document generated:");
        assertThat(pdfText).contains("Version:");
    }

    @Test
    void testGenerateConceptPdf_MinimalConcept() throws Exception {
        // Given - Only basic required fields
        ConceptEntity minimalConcept = new ConceptEntity();
        minimalConcept.setId(UUID.randomUUID());
        minimalConcept.setTitle("Minimal Event");
        minimalConcept.setStatus(ConceptStatus.DRAFT);
        minimalConcept.setUserId(UUID.randomUUID());
        minimalConcept.setCreatedAt(OffsetDateTime.now());
        minimalConcept.setUpdatedAt(OffsetDateTime.now());
        minimalConcept.setLastModifiedBy(UUID.randomUUID());

        // When
        Resource pdfResource = pdfService.generateConceptPdf(minimalConcept);

        // Then
        assertThat(pdfResource).isNotNull();
        assertThat(pdfResource.exists()).isTrue();
        
        String pdfText = extractTextFromPdf(pdfResource);
        assertThat(pdfText).contains("Minimal Event");
        assertThat(pdfText).contains("Event Concept Document");
        assertThat(pdfText).contains("DRAFT");
        // Should not contain sections that have no data
        assertThat(pdfText).doesNotContain("Event Agenda");
        assertThat(pdfText).doesNotContain("Speaker Information");
        assertThat(pdfText).doesNotContain("Ticket Pricing");
    }

    @Test
    void testGenerateConceptPdf_HandlesNullFields() throws Exception {
        // Given
        testConcept.setDescription(null);
        testConcept.setNotes(null);
        testConcept.setTags(null);

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then
        assertThat(pdfResource).isNotNull();
        assertThat(pdfResource.exists()).isTrue();
        
        String pdfText = extractTextFromPdf(pdfResource);
        assertThat(pdfText).contains("Test Event Concept");
        assertThat(pdfText).contains("Event Concept Document");
    }

    @Test
    void testGenerateConceptPdf_VerifyPdfStructure() throws Exception {
        // Given
        setupCompleteTestConcept();

        // When
        Resource pdfResource = pdfService.generateConceptPdf(testConcept);

        // Then - Verify PDF structure
        try (PdfDocument pdfDoc = new PdfDocument(new PdfReader(pdfResource.getInputStream()))) {
            assertThat(pdfDoc.getNumberOfPages()).isGreaterThanOrEqualTo(1);
            assertThat(pdfDoc.getNumberOfPages()).isLessThanOrEqualTo(3); // Should be 2-3 pages max
        }
    }

    private String extractTextFromPdf(Resource pdfResource) throws Exception {
        StringBuilder text = new StringBuilder();
        try (PdfDocument pdfDoc = new PdfDocument(new PdfReader(pdfResource.getInputStream()))) {
            for (int i = 1; i <= pdfDoc.getNumberOfPages(); i++) {
                text.append(PdfTextExtractor.getTextFromPage(pdfDoc.getPage(i)));
            }
        }
        return text.toString();
    }

    private void setupCompleteTestConcept() {
        // Event details
        EventDetailsEntity eventDetails = new EventDetailsEntity();
        eventDetails.setTheme("Complete Tech Conference");
        eventDetails.setFormat(EventFormat.HYBRID);
        eventDetails.setCapacity(750);
        eventDetails.setDuration("3 days");
        eventDetails.setStartDate(LocalDate.of(2024, 9, 15));
        eventDetails.setEndDate(LocalDate.of(2024, 9, 17));
        eventDetails.setLocation("Munich International Conference Center");
        eventDetails.setTargetAudience("Technology professionals, developers, and business leaders");
        eventDetails.setObjectives(List.of(
            "Showcase cutting-edge technology trends",
            "Facilitate networking opportunities",
            "Provide hands-on learning experiences",
            "Explore AI and machine learning applications"
        ));
        testConcept.setEventDetails(eventDetails);

        // Agenda
        AgendaItemEntity agenda1 = new AgendaItemEntity();
        agenda1.setTime("09:00");
        agenda1.setTitle("Opening Keynote: Future of Technology");
        agenda1.setDescription("Comprehensive overview of emerging tech trends");
        agenda1.setType(AgendaItemType.KEYNOTE);
        agenda1.setSpeaker("Dr. Sarah Johnson");

        AgendaItemEntity agenda2 = new AgendaItemEntity();
        agenda2.setTime("11:00");
        agenda2.setTitle("AI Workshop: Building Smart Applications");
        agenda2.setDescription("Hands-on session on implementing AI solutions");
        agenda2.setType(AgendaItemType.WORKSHOP);
        agenda2.setSpeaker("Prof. Michael Chen");

        testConcept.setAgenda(List.of(agenda1, agenda2));

        // Speakers
        SpeakerEntity speaker1 = new SpeakerEntity();
        speaker1.setName("Dr. Sarah Johnson");
        speaker1.setExpertise("Technology Innovation and Strategy");
        speaker1.setBio("Renowned technology strategist with 20+ years experience leading digital transformation initiatives at Fortune 500 companies.");
        speaker1.setSuggestedTopic("Digital Transformation in the AI Era");
        speaker1.setConfirmed(true);

        SpeakerEntity speaker2 = new SpeakerEntity();
        speaker2.setName("Prof. Michael Chen");
        speaker2.setExpertise("Artificial Intelligence and Machine Learning");
        speaker2.setBio("Computer Science professor and AI researcher, author of multiple publications on deep learning applications.");
        speaker2.setSuggestedTopic("Practical AI Implementation Strategies");
        speaker2.setConfirmed(true);

        testConcept.setSpeakers(List.of(speaker1, speaker2));

        // Pricing
        PricingEntity pricing = new PricingEntity();
        pricing.setCurrency("EUR");
        pricing.setEarlyBird(new BigDecimal("299.00"));
        pricing.setRegular(new BigDecimal("399.00"));
        pricing.setVip(new BigDecimal("599.00"));
        pricing.setStudent(new BigDecimal("149.00"));
        pricing.setGroup(new BigDecimal("349.00"));
        testConcept.setPricing(pricing);

        // Additional data
        testConcept.setNotes("Special arrangements needed:\n- Live streaming for virtual attendees\n- Simultaneous translation (German/English)\n- Accessibility features for disabled participants\n- Networking app for attendee connections");
        testConcept.setTags(List.of("technology", "AI", "innovation", "networking", "professional-development", "digital-transformation"));
    }
} 