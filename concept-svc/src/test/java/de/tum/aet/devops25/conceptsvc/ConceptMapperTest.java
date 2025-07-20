package de.tum.aet.devops25.conceptsvc;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.ActiveProfiles;

import de.tum.aet.devops25.api.generated.model.Concept;
import de.tum.aet.devops25.api.generated.model.UpdateConceptRequest;
import de.tum.aet.devops25.api.generated.model.EventDetails;
import de.tum.aet.devops25.api.generated.model.AgendaItem;
import de.tum.aet.devops25.api.generated.model.Speaker;

@ActiveProfiles("test")
class ConceptMapperTest {

    private ConceptEntity testEntity;
    private Concept testDto;
    private UUID testId;
    private UUID testUserId;
    private OffsetDateTime testTimestamp;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testUserId = UUID.randomUUID();
        testTimestamp = OffsetDateTime.now();

        // Setup test entity
        testEntity = new ConceptEntity();
        testEntity.setId(testId);
        testEntity.setTitle("Test Concept");
        testEntity.setDescription("Test Description");
        testEntity.setStatus(ConceptStatus.DRAFT);
        testEntity.setUserId(testUserId);
        testEntity.setNotes("Test Notes");
        testEntity.setVersion(1);
        testEntity.setCreatedAt(testTimestamp);
        testEntity.setUpdatedAt(testTimestamp);
        testEntity.setLastModifiedBy(testUserId);
        testEntity.setTags(List.of("tag1", "tag2"));

        // Setup test DTO
        testDto = new Concept();
        testDto.setId(testId);
        testDto.setTitle("Test Concept");
        testDto.setDescription("Test Description");
        testDto.setStatus(Concept.StatusEnum.DRAFT);
        testDto.setUserId(testUserId);
        testDto.setNotes("Test Notes");
        testDto.setVersion(1);
        testDto.setCreatedAt(testTimestamp);
        testDto.setUpdatedAt(testTimestamp);
        testDto.setLastModifiedBy(testUserId);
        testDto.setTags(List.of("tag1", "tag2"));
    }

    @Test
    void testToDto_BasicMapping() {
        // When
        Concept dto = ConceptMapper.toDto(testEntity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(testEntity.getId());
        assertThat(dto.getTitle()).isEqualTo(testEntity.getTitle());
        assertThat(dto.getDescription()).isEqualTo(testEntity.getDescription());
        assertThat(dto.getStatus().getValue()).isEqualTo(testEntity.getStatus().name());
        assertThat(dto.getUserId()).isEqualTo(testEntity.getUserId());
        assertThat(dto.getNotes()).isEqualTo(testEntity.getNotes());
        assertThat(dto.getVersion()).isEqualTo(testEntity.getVersion());
        assertThat(dto.getCreatedAt()).isEqualTo(testEntity.getCreatedAt());
        assertThat(dto.getUpdatedAt()).isEqualTo(testEntity.getUpdatedAt());
        assertThat(dto.getLastModifiedBy()).isEqualTo(testEntity.getLastModifiedBy());
        assertThat(dto.getTags()).containsExactlyElementsOf(testEntity.getTags());
    }

    @Test
    void testToDto_WithNullEntity() {
        // When
        Concept dto = ConceptMapper.toDto(null);

        // Then
        assertThat(dto).isNull();
    }

    @Test
    void testToDto_WithNullFields() {
        // Given
        testEntity.setDescription(null);
        testEntity.setNotes(null);
        testEntity.setTags(null);

        // When
        Concept dto = ConceptMapper.toDto(testEntity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getDescription()).isNull();
        assertThat(dto.getNotes()).isNull();
        assertThat(dto.getTags()).isEmpty();
    }

    @Test
    void testToEntity_BasicMapping() {
        // When
        ConceptEntity entity = ConceptMapper.toEntity(testDto);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getId()).isEqualTo(testDto.getId());
        assertThat(entity.getTitle()).isEqualTo(testDto.getTitle());
        assertThat(entity.getDescription()).isEqualTo(testDto.getDescription());
        assertThat(entity.getStatus().name()).isEqualTo(testDto.getStatus().getValue());
        assertThat(entity.getUserId()).isEqualTo(testDto.getUserId());
        assertThat(entity.getNotes()).isEqualTo(testDto.getNotes());
        assertThat(entity.getVersion()).isEqualTo(testDto.getVersion());
        assertThat(entity.getCreatedAt()).isEqualTo(testDto.getCreatedAt());
        assertThat(entity.getUpdatedAt()).isEqualTo(testDto.getUpdatedAt());
        assertThat(entity.getLastModifiedBy()).isEqualTo(testDto.getLastModifiedBy());
        assertThat(entity.getTags()).containsExactlyElementsOf(testDto.getTags());
    }

    @Test
    void testToEntity_WithNullDto() {
        // When
        ConceptEntity entity = ConceptMapper.toEntity(null);

        // Then
        assertThat(entity).isNull();
    }

    @Test
    void testToEntity_WithNullFields() {
        // Given
        testDto.setDescription(null);
        testDto.setNotes(null);
        testDto.setTags(null);

        // When
        ConceptEntity entity = ConceptMapper.toEntity(testDto);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getDescription()).isNull();
        assertThat(entity.getNotes()).isNull();
        assertThat(entity.getTags()).isEmpty();
    }

    @Test
    void testToDto_WithEventDetails() {
        // Given
        EventDetailsEntity eventDetails = new EventDetailsEntity();
        eventDetails.setTheme("Test Theme");
        eventDetails.setFormat(EventFormat.HYBRID);
        eventDetails.setCapacity(100);
        testEntity.setEventDetails(eventDetails);

        // When
        Concept dto = ConceptMapper.toDto(testEntity);

        // Then
        assertThat(dto.getEventDetails()).isNotNull();
        assertThat(dto.getEventDetails().getTheme()).isEqualTo("Test Theme");
    }

    @Test
    void testToDto_WithAgenda() {
        // Given
        AgendaItemEntity agendaItem = new AgendaItemEntity();
        agendaItem.setTime("10:00");
        agendaItem.setTitle("Test Session");
        agendaItem.setType(AgendaItemType.KEYNOTE);
        testEntity.setAgenda(List.of(agendaItem));

        // When
        Concept dto = ConceptMapper.toDto(testEntity);

        // Then
        assertThat(dto.getAgenda()).hasSize(1);
        assertThat(dto.getAgenda().get(0).getTime()).isEqualTo("10:00");
        assertThat(dto.getAgenda().get(0).getTitle()).isEqualTo("Test Session");
    }

    @Test
    void testToDto_WithSpeakers() {
        // Given
        SpeakerEntity speaker = new SpeakerEntity();
        speaker.setName("John Doe");
        speaker.setExpertise("Technology");
        testEntity.setSpeakers(List.of(speaker));

        // When
        Concept dto = ConceptMapper.toDto(testEntity);

        // Then
        assertThat(dto.getSpeakers()).hasSize(1);
        assertThat(dto.getSpeakers().get(0).getName()).isEqualTo("John Doe");
        assertThat(dto.getSpeakers().get(0).getExpertise()).isEqualTo("Technology");
    }

    @Test
    void testToEntity_WithEventDetails() {
        // Given
        EventDetails eventDetails = new EventDetails();
        eventDetails.setTheme("Test Theme");
        eventDetails.setFormat(EventDetails.FormatEnum.HYBRID);
        eventDetails.setCapacity(100);
        testDto.setEventDetails(eventDetails);

        // When
        ConceptEntity entity = ConceptMapper.toEntity(testDto);

        // Then
        assertThat(entity.getEventDetails()).isNotNull();
        assertThat(entity.getEventDetails().getTheme()).isEqualTo("Test Theme");
    }

    @Test
    void testToEntity_WithAgenda() {
        // Given
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setTime("10:00");
        agendaItem.setTitle("Test Session");
        agendaItem.setType(AgendaItem.TypeEnum.KEYNOTE);
        testDto.setAgenda(List.of(agendaItem));

        // When
        ConceptEntity entity = ConceptMapper.toEntity(testDto);

        // Then
        assertThat(entity.getAgenda()).hasSize(1);
        assertThat(entity.getAgenda().get(0).getTime()).isEqualTo("10:00");
        assertThat(entity.getAgenda().get(0).getTitle()).isEqualTo("Test Session");
        assertThat(entity.getAgenda().get(0).getConcept()).isEqualTo(entity);
    }

    @Test
    void testToEntity_WithSpeakers() {
        // Given
        Speaker speaker = new Speaker();
        speaker.setName("John Doe");
        speaker.setExpertise("Technology");
        testDto.setSpeakers(List.of(speaker));

        // When
        ConceptEntity entity = ConceptMapper.toEntity(testDto);

        // Then
        assertThat(entity.getSpeakers()).hasSize(1);
        assertThat(entity.getSpeakers().get(0).getName()).isEqualTo("John Doe");
        assertThat(entity.getSpeakers().get(0).getExpertise()).isEqualTo("Technology");
        assertThat(entity.getSpeakers().get(0).getConcept()).isEqualTo(entity);
    }

    @Test
    void testUpdateEntityFromRequest_BasicFields() {
        // Given
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setTitle("Updated Title");
        request.setDescription("Updated Description");
        request.setStatus(UpdateConceptRequest.StatusEnum.COMPLETED);
        request.setNotes("Updated Notes");
        request.setTags(List.of("newtag1", "newtag2"));

        // When
        ConceptMapper.updateEntityFromRequest(testEntity, request);

        // Then
        assertThat(testEntity.getTitle()).isEqualTo("Updated Title");
        assertThat(testEntity.getDescription()).isEqualTo("Updated Description");
        assertThat(testEntity.getStatus()).isEqualTo(ConceptStatus.COMPLETED);
        assertThat(testEntity.getNotes()).isEqualTo("Updated Notes");
        assertThat(testEntity.getTags()).containsExactly("newtag1", "newtag2");
    }

    @Test
    void testUpdateEntityFromRequest_PartialUpdate() {
        // Given
        String originalDescription = testEntity.getDescription();
        String originalNotes = testEntity.getNotes();
        
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setTitle("Updated Title Only");
        // Not setting other fields - they should remain unchanged

        // When
        ConceptMapper.updateEntityFromRequest(testEntity, request);

        // Then
        assertThat(testEntity.getTitle()).isEqualTo("Updated Title Only");
        assertThat(testEntity.getDescription()).isEqualTo(originalDescription);
        assertThat(testEntity.getNotes()).isEqualTo(originalNotes);
    }

    @Test
    void testUpdateEntityFromRequest_WithNullEntityOrRequest() {
        // When & Then - should not throw exceptions
        ConceptMapper.updateEntityFromRequest(null, new UpdateConceptRequest());
        ConceptMapper.updateEntityFromRequest(testEntity, null);
        ConceptMapper.updateEntityFromRequest(null, null);
    }

    @Test
    void testUpdateEntityFromRequest_WithEventDetails() {
        // Given
        EventDetails eventDetails = new EventDetails();
        eventDetails.setTheme("Updated Theme");
        eventDetails.setFormat(EventDetails.FormatEnum.VIRTUAL);
        
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setEventDetails(eventDetails);

        // When
        ConceptMapper.updateEntityFromRequest(testEntity, request);

        // Then
        assertThat(testEntity.getEventDetails()).isNotNull();
        assertThat(testEntity.getEventDetails().getTheme()).isEqualTo("Updated Theme");
    }

    @Test
    void testUpdateEntityFromRequest_WithAgenda() {
        // Given
        testEntity.setAgenda(new ArrayList<>());
        
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setTime("11:00");
        agendaItem.setTitle("Updated Session");
        
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setAgenda(List.of(agendaItem));

        // When
        ConceptMapper.updateEntityFromRequest(testEntity, request);

        // Then
        assertThat(testEntity.getAgenda()).hasSize(1);
        assertThat(testEntity.getAgenda().get(0).getTime()).isEqualTo("11:00");
        assertThat(testEntity.getAgenda().get(0).getConcept()).isEqualTo(testEntity);
    }

    @Test
    void testUpdateEntityFromRequest_WithSpeakers() {
        // Given
        testEntity.setSpeakers(new ArrayList<>());
        
        Speaker speaker = new Speaker();
        speaker.setName("Updated Speaker");
        speaker.setExpertise("Updated Expertise");
        
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setSpeakers(List.of(speaker));

        // When
        ConceptMapper.updateEntityFromRequest(testEntity, request);

        // Then
        assertThat(testEntity.getSpeakers()).hasSize(1);
        assertThat(testEntity.getSpeakers().get(0).getName()).isEqualTo("Updated Speaker");
        assertThat(testEntity.getSpeakers().get(0).getConcept()).isEqualTo(testEntity);
    }

    @Test
    void testToDto_WithNullStatus() {
        // Given
        testEntity.setStatus(null);

        // When
        Concept dto = ConceptMapper.toDto(testEntity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isNull();
    }

    @Test
    void testToEntity_WithNullStatus() {
        // Given
        testDto.setStatus(null);

        // When
        ConceptEntity entity = ConceptMapper.toEntity(testDto);

        // Then
        assertThat(entity).isNotNull();
        // Status should remain null since it's not set
    }

    @Test
    void testToDto_WithEmptyAgenda() {
        // Given
        testEntity.setAgenda(new ArrayList<>());

        // When
        Concept dto = ConceptMapper.toDto(testEntity);

        // Then
        assertThat(dto.getAgenda()).isEmpty();
    }

    @Test
    void testToDto_WithEmptySpeakers() {
        // Given
        testEntity.setSpeakers(new ArrayList<>());

        // When
        Concept dto = ConceptMapper.toDto(testEntity);

        // Then
        assertThat(dto.getSpeakers()).isEmpty();
    }

    @Test
    void testToEntity_WithEmptyAgenda() {
        // Given
        testDto.setAgenda(new ArrayList<>());

        // When
        ConceptEntity entity = ConceptMapper.toEntity(testDto);

        // Then
        assertThat(entity.getAgenda()).isEmpty();
    }

    @Test
    void testToEntity_WithEmptySpeakers() {
        // Given
        testDto.setSpeakers(new ArrayList<>());

        // When
        ConceptEntity entity = ConceptMapper.toEntity(testDto);

        // Then
        assertThat(entity.getSpeakers()).isEmpty();
    }

    @Test
    void testToDto_WithNullAgenda() {
        // Given
        testEntity.setAgenda(null);

        // When
        Concept dto = ConceptMapper.toDto(testEntity);

        // Then
        assertThat(dto.getAgenda()).isEmpty();
    }

    @Test
    void testToDto_WithNullSpeakers() {
        // Given
        testEntity.setSpeakers(null);

        // When
        Concept dto = ConceptMapper.toDto(testEntity);

        // Then
        assertThat(dto.getSpeakers()).isEmpty();
    }

    @Test
    void testToEntity_WithNullAgenda() {
        // Given
        testDto.setAgenda(null);

        // When
        ConceptEntity entity = ConceptMapper.toEntity(testDto);

        // Then
        assertThat(entity.getAgenda()).isEmpty();
    }

    @Test
    void testToEntity_WithNullSpeakers() {
        // Given
        testDto.setSpeakers(null);

        // When
        ConceptEntity entity = ConceptMapper.toEntity(testDto);

        // Then
        assertThat(entity.getSpeakers()).isEmpty();
    }

    @Test
    void testUpdateEntityFromRequest_WithNullAgenda() {
        // Given
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setAgenda(null);

        String originalTitle = testEntity.getTitle();

        // When
        ConceptMapper.updateEntityFromRequest(testEntity, request);

        // Then - agenda should remain unchanged
        assertThat(testEntity.getTitle()).isEqualTo(originalTitle);
    }

    @Test
    void testUpdateEntityFromRequest_WithNullSpeakers() {
        // Given
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setSpeakers(null);

        String originalTitle = testEntity.getTitle();

        // When
        ConceptMapper.updateEntityFromRequest(testEntity, request);

        // Then - speakers should remain unchanged
        assertThat(testEntity.getTitle()).isEqualTo(originalTitle);
    }

    @Test
    void testUpdateEntityFromRequest_WithNewAgendaItemsWithoutIds() {
        // Given - Frontend sends agenda items without IDs (new behavior)
        testEntity.setAgenda(new ArrayList<>());
        
        AgendaItem newAgendaItem1 = new AgendaItem();
        // No ID set - frontend doesn't generate IDs anymore
        newAgendaItem1.setTime("09:00");
        newAgendaItem1.setTitle("Opening Session");
        newAgendaItem1.setType(AgendaItem.TypeEnum.KEYNOTE);
        newAgendaItem1.setDuration(60);
        
        AgendaItem newAgendaItem2 = new AgendaItem();
        // No ID set here either
        newAgendaItem2.setTime("10:30");
        newAgendaItem2.setTitle("Workshop 1");
        newAgendaItem2.setType(AgendaItem.TypeEnum.WORKSHOP);
        newAgendaItem2.setDuration(90);
        
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setAgenda(List.of(newAgendaItem1, newAgendaItem2));

        // When
        ConceptMapper.updateEntityFromRequest(testEntity, request);

        // Then
        assertThat(testEntity.getAgenda()).hasSize(2);
        
        // First agenda item
        assertThat(testEntity.getAgenda().get(0).getId()).isNull(); // No ID - JPA will generate
        assertThat(testEntity.getAgenda().get(0).getTime()).isEqualTo("09:00");
        assertThat(testEntity.getAgenda().get(0).getTitle()).isEqualTo("Opening Session");
        assertThat(testEntity.getAgenda().get(0).getConcept()).isEqualTo(testEntity);
        
        // Second agenda item
        assertThat(testEntity.getAgenda().get(1).getId()).isNull(); // No ID - JPA will generate
        assertThat(testEntity.getAgenda().get(1).getTime()).isEqualTo("10:30");
        assertThat(testEntity.getAgenda().get(1).getTitle()).isEqualTo("Workshop 1");
        assertThat(testEntity.getAgenda().get(1).getConcept()).isEqualTo(testEntity);
    }

    @Test
    void testUpdateEntityFromRequest_WithNewSpeakersWithoutIds() {
        // Given - Frontend sends speakers without IDs (new behavior)
        testEntity.setSpeakers(new ArrayList<>());
        
        Speaker newSpeaker1 = new Speaker();
        // No ID set - frontend doesn't generate IDs anymore
        newSpeaker1.setName("Dr. Alice Johnson");
        newSpeaker1.setExpertise("Artificial Intelligence");
        newSpeaker1.setSuggestedTopic("Future of AI");
        newSpeaker1.setConfirmed(false);
        
        Speaker newSpeaker2 = new Speaker();
        // No ID set here either
        newSpeaker2.setName("Bob Smith");
        newSpeaker2.setExpertise("Data Science");
        newSpeaker2.setSuggestedTopic("Big Data Analytics");
        newSpeaker2.setConfirmed(true);
        
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setSpeakers(List.of(newSpeaker1, newSpeaker2));

        // When
        ConceptMapper.updateEntityFromRequest(testEntity, request);

        // Then
        assertThat(testEntity.getSpeakers()).hasSize(2);
        
        // First speaker
        assertThat(testEntity.getSpeakers().get(0).getId()).isNull(); // No ID - JPA will generate
        assertThat(testEntity.getSpeakers().get(0).getName()).isEqualTo("Dr. Alice Johnson");
        assertThat(testEntity.getSpeakers().get(0).getExpertise()).isEqualTo("Artificial Intelligence");
        assertThat(testEntity.getSpeakers().get(0).getConcept()).isEqualTo(testEntity);
        
        // Second speaker
        assertThat(testEntity.getSpeakers().get(1).getId()).isNull(); // No ID - JPA will generate
        assertThat(testEntity.getSpeakers().get(1).getName()).isEqualTo("Bob Smith");
        assertThat(testEntity.getSpeakers().get(1).getExpertise()).isEqualTo("Data Science");
        assertThat(testEntity.getSpeakers().get(1).getConcept()).isEqualTo(testEntity);
    }

    @Test
    void testUpdateEntityFromRequest_WithMixedAgendaItems() {
        // Given - Mix of existing items (with IDs) and new items (without IDs)
        testEntity.setAgenda(new ArrayList<>());
        
        UUID existingId = UUID.randomUUID();
        AgendaItem existingItem = new AgendaItem();
        existingItem.setId(existingId); // Has ID - existing item
        existingItem.setTime("14:00");
        existingItem.setTitle("Existing Panel");
        existingItem.setType(AgendaItem.TypeEnum.PANEL);
        existingItem.setDuration(75);
        
        AgendaItem newItem = new AgendaItem();
        // No ID - new item
        newItem.setTime("15:30");
        newItem.setTitle("New Workshop");
        newItem.setType(AgendaItem.TypeEnum.WORKSHOP);
        newItem.setDuration(120);
        
        UpdateConceptRequest request = new UpdateConceptRequest();
        request.setAgenda(List.of(existingItem, newItem));

        // When
        ConceptMapper.updateEntityFromRequest(testEntity, request);

        // Then
        assertThat(testEntity.getAgenda()).hasSize(2);
        
        // Existing item keeps its ID
        assertThat(testEntity.getAgenda().get(0).getId()).isEqualTo(existingId);
        assertThat(testEntity.getAgenda().get(0).getTitle()).isEqualTo("Existing Panel");
        
        // New item has no ID (JPA will generate)
        assertThat(testEntity.getAgenda().get(1).getId()).isNull();
        assertThat(testEntity.getAgenda().get(1).getTitle()).isEqualTo("New Workshop");
    }
} 