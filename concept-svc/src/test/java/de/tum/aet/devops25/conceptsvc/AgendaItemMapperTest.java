package de.tum.aet.devops25.conceptsvc;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import de.tum.aet.devops25.api.generated.model.AgendaItem;

class AgendaItemMapperTest {

    @Test
    void testToEntity_WithValidAgendaItemWithId() {
        // Given
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(UUID.randomUUID());
        agendaItem.setTime("14:00");
        agendaItem.setTitle("Keynote Speech");
        agendaItem.setDescription("Opening keynote about AI trends");
        agendaItem.setType(AgendaItem.TypeEnum.KEYNOTE);
        agendaItem.setSpeaker("Dr. Jane Smith");
        agendaItem.setDuration(90);

        // When
        AgendaItemEntity entity = AgendaItemMapper.toEntity(agendaItem);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getId()).isEqualTo(agendaItem.getId());
        assertThat(entity.getTime()).isEqualTo("14:00");
        assertThat(entity.getTitle()).isEqualTo("Keynote Speech");
        assertThat(entity.getDescription()).isEqualTo("Opening keynote about AI trends");
        assertThat(entity.getType()).isEqualTo(AgendaItemType.KEYNOTE);
        assertThat(entity.getSpeaker()).isEqualTo("Dr. Jane Smith");
        assertThat(entity.getDuration()).isEqualTo(90);
    }

    @Test
    void testToEntity_WithValidAgendaItemWithoutId() {
        // Given - This is the new behavior: no ID provided
        AgendaItem agendaItem = new AgendaItem();
        // No ID set - this is what the frontend will now send
        agendaItem.setTime("15:30");
        agendaItem.setTitle("Workshop Session");
        agendaItem.setDescription("Hands-on machine learning workshop");
        agendaItem.setType(AgendaItem.TypeEnum.WORKSHOP);
        agendaItem.setSpeaker("Mark Johnson");
        agendaItem.setDuration(120);

        // When
        AgendaItemEntity entity = AgendaItemMapper.toEntity(agendaItem);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getId()).isNull(); // ID should be null, JPA will generate it
        assertThat(entity.getTime()).isEqualTo("15:30");
        assertThat(entity.getTitle()).isEqualTo("Workshop Session");
        assertThat(entity.getDescription()).isEqualTo("Hands-on machine learning workshop");
        assertThat(entity.getType()).isEqualTo(AgendaItemType.WORKSHOP);
        assertThat(entity.getSpeaker()).isEqualTo("Mark Johnson");
        assertThat(entity.getDuration()).isEqualTo(120);
    }

    @Test
    void testToEntity_WithNullAgendaItem() {
        // When
        AgendaItemEntity entity = AgendaItemMapper.toEntity(null);

        // Then
        assertThat(entity).isNull();
    }

    @Test
    void testToEntity_WithNullFields() {
        // Given
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setId(null); // Explicitly null ID
        agendaItem.setTime("10:00");
        agendaItem.setTitle("Coffee Break");
        agendaItem.setDescription(null);
        agendaItem.setType(null);
        agendaItem.setSpeaker(null);
        agendaItem.setDuration(null);

        // When
        AgendaItemEntity entity = AgendaItemMapper.toEntity(agendaItem);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getId()).isNull();
        assertThat(entity.getTime()).isEqualTo("10:00");
        assertThat(entity.getTitle()).isEqualTo("Coffee Break");
        assertThat(entity.getDescription()).isNull();
        assertThat(entity.getType()).isNull();
        assertThat(entity.getSpeaker()).isNull();
        assertThat(entity.getDuration()).isNull();
    }

    @Test
    void testToDto_WithValidEntity() {
        // Given
        AgendaItemEntity entity = new AgendaItemEntity();
        entity.setId(UUID.randomUUID());
        entity.setTime("16:00");
        entity.setTitle("Panel Discussion");
        entity.setDescription("Future of AI in business");
        entity.setType(AgendaItemType.PANEL);
        entity.setSpeaker("Panel of Experts");
        entity.setDuration(75);

        // When
        AgendaItem dto = AgendaItemMapper.toDto(entity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(entity.getId());
        assertThat(dto.getTime()).isEqualTo("16:00");
        assertThat(dto.getTitle()).isEqualTo("Panel Discussion");
        assertThat(dto.getDescription()).isEqualTo("Future of AI in business");
        assertThat(dto.getType()).isEqualTo(AgendaItem.TypeEnum.PANEL);
        assertThat(dto.getSpeaker()).isEqualTo("Panel of Experts");
        assertThat(dto.getDuration()).isEqualTo(75);
    }

    @Test
    void testToDto_WithNullEntity() {
        // When
        AgendaItem dto = AgendaItemMapper.toDto(null);

        // Then
        assertThat(dto).isNull();
    }

    @Test
    void testToDto_WithNullFields() {
        // Given
        AgendaItemEntity entity = new AgendaItemEntity();
        entity.setId(null);
        entity.setTime("12:00");
        entity.setTitle("Lunch Break");
        entity.setDescription(null);
        entity.setType(null);
        entity.setSpeaker(null);
        entity.setDuration(null);

        // When
        AgendaItem dto = AgendaItemMapper.toDto(entity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isNull();
        assertThat(dto.getTime()).isEqualTo("12:00");
        assertThat(dto.getTitle()).isEqualTo("Lunch Break");
        assertThat(dto.getDescription()).isNull();
        assertThat(dto.getType()).isNull();
        assertThat(dto.getSpeaker()).isNull();
        assertThat(dto.getDuration()).isNull();
    }

    @Test
    void testBidirectionalMapping_WithId() {
        // Given
        AgendaItem originalDto = new AgendaItem();
        originalDto.setId(UUID.randomUUID());
        originalDto.setTime("09:00");
        originalDto.setTitle("Opening Ceremony");
        originalDto.setType(AgendaItem.TypeEnum.KEYNOTE);
        originalDto.setDuration(60);

        // When
        AgendaItemEntity entity = AgendaItemMapper.toEntity(originalDto);
        AgendaItem convertedDto = AgendaItemMapper.toDto(entity);

        // Then
        assertThat(convertedDto.getId()).isEqualTo(originalDto.getId());
        assertThat(convertedDto.getTime()).isEqualTo(originalDto.getTime());
        assertThat(convertedDto.getTitle()).isEqualTo(originalDto.getTitle());
        assertThat(convertedDto.getType()).isEqualTo(originalDto.getType());
        assertThat(convertedDto.getDuration()).isEqualTo(originalDto.getDuration());
    }

    @Test
    void testBidirectionalMapping_WithoutId() {
        // Given - New scenario: no ID provided initially
        AgendaItem originalDto = new AgendaItem();
        // No ID set - frontend will send this
        originalDto.setTime("11:30");
        originalDto.setTitle("Technical Session");
        originalDto.setType(AgendaItem.TypeEnum.WORKSHOP);
        originalDto.setDuration(90);

        // When - Entity created without ID, then ID gets generated (simulated)
        AgendaItemEntity entity = AgendaItemMapper.toEntity(originalDto);
        UUID generatedId = UUID.randomUUID(); // Simulate JPA generating ID
        entity.setId(generatedId);
        AgendaItem convertedDto = AgendaItemMapper.toDto(entity);

        // Then
        assertThat(convertedDto.getId()).isEqualTo(generatedId); // Now has generated ID
        assertThat(convertedDto.getTime()).isEqualTo(originalDto.getTime());
        assertThat(convertedDto.getTitle()).isEqualTo(originalDto.getTitle());
        assertThat(convertedDto.getType()).isEqualTo(originalDto.getType());
        assertThat(convertedDto.getDuration()).isEqualTo(originalDto.getDuration());
    }

    @Test
    void testToEntity_WithMinimalFields() {
        // Given
        AgendaItem agendaItem = new AgendaItem();
        agendaItem.setTime("13:00");
        agendaItem.setTitle("Networking Session");
        agendaItem.setDuration(30);
        // Only required fields set

        // When
        AgendaItemEntity entity = AgendaItemMapper.toEntity(agendaItem);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getId()).isNull(); // No ID provided
        assertThat(entity.getTime()).isEqualTo("13:00");
        assertThat(entity.getTitle()).isEqualTo("Networking Session");
        assertThat(entity.getDuration()).isEqualTo(30);
        assertThat(entity.getDescription()).isNull();
        assertThat(entity.getType()).isNull();
        assertThat(entity.getSpeaker()).isNull();
    }

    @Test
    void testToDto_WithMinimalFields() {
        // Given
        AgendaItemEntity entity = new AgendaItemEntity();
        entity.setTime("17:00");
        entity.setTitle("Closing Remarks");
        entity.setDuration(15);
        // Only required fields set

        // When
        AgendaItem dto = AgendaItemMapper.toDto(entity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isNull(); // No ID in entity
        assertThat(dto.getTime()).isEqualTo("17:00");
        assertThat(dto.getTitle()).isEqualTo("Closing Remarks");
        assertThat(dto.getDuration()).isEqualTo(15);
        assertThat(dto.getDescription()).isNull();
        assertThat(dto.getType()).isNull();
        assertThat(dto.getSpeaker()).isNull();
    }
} 