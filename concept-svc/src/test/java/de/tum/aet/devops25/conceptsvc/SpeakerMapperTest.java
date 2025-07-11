package de.tum.aet.devops25.conceptsvc;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import de.tum.aet.devops25.api.generated.model.Speaker;

class SpeakerMapperTest {

    @Test
    void testToEntity_WithValidSpeaker() {
        // Given
        Speaker speaker = new Speaker();
        speaker.setId(UUID.randomUUID());
        speaker.setName("John Doe");
        speaker.setExpertise("Technology");
        speaker.setSuggestedTopic("AI in Healthcare");
        speaker.setBio("Experienced technology leader");
        speaker.setConfirmed(true);

        // When
        SpeakerEntity entity = SpeakerMapper.toEntity(speaker);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getId()).isEqualTo(speaker.getId());
        assertThat(entity.getName()).isEqualTo("John Doe");
        assertThat(entity.getExpertise()).isEqualTo("Technology");
        assertThat(entity.getSuggestedTopic()).isEqualTo("AI in Healthcare");
        assertThat(entity.getBio()).isEqualTo("Experienced technology leader");
        assertThat(entity.getConfirmed()).isTrue();
    }

    @Test
    void testToEntity_WithNullSpeaker() {
        // When
        SpeakerEntity entity = SpeakerMapper.toEntity(null);

        // Then
        assertThat(entity).isNull();
    }

    @Test
    void testToEntity_WithNullFields() {
        // Given
        Speaker speaker = new Speaker();
        speaker.setId(null);
        speaker.setName("Required Name");
        speaker.setExpertise(null);
        speaker.setSuggestedTopic(null);
        speaker.setBio(null);
        speaker.setConfirmed(null);

        // When
        SpeakerEntity entity = SpeakerMapper.toEntity(speaker);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getId()).isNull();
        assertThat(entity.getName()).isEqualTo("Required Name");
        assertThat(entity.getExpertise()).isNull();
        assertThat(entity.getSuggestedTopic()).isNull();
        assertThat(entity.getBio()).isNull();
        assertThat(entity.getConfirmed()).isNull();
    }

    @Test
    void testToDto_WithValidEntity() {
        // Given
        SpeakerEntity entity = new SpeakerEntity();
        entity.setId(UUID.randomUUID());
        entity.setName("Jane Smith");
        entity.setExpertise("Data Science");
        entity.setSuggestedTopic("Machine Learning Trends");
        entity.setBio("Senior data scientist with 10 years experience");
        entity.setConfirmed(false);

        // When
        Speaker dto = SpeakerMapper.toDto(entity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(entity.getId());
        assertThat(dto.getName()).isEqualTo("Jane Smith");
        assertThat(dto.getExpertise()).isEqualTo("Data Science");
        assertThat(dto.getSuggestedTopic()).isEqualTo("Machine Learning Trends");
        assertThat(dto.getBio()).isEqualTo("Senior data scientist with 10 years experience");
        assertThat(dto.getConfirmed()).isFalse();
    }

    @Test
    void testToDto_WithNullEntity() {
        // When
        Speaker dto = SpeakerMapper.toDto(null);

        // Then
        assertThat(dto).isNull();
    }

    @Test
    void testToDto_WithNullFields() {
        // Given
        SpeakerEntity entity = new SpeakerEntity();
        entity.setId(null);
        entity.setName("Required Name");
        entity.setExpertise(null);
        entity.setSuggestedTopic(null);
        entity.setBio(null);
        entity.setConfirmed(null);

        // When
        Speaker dto = SpeakerMapper.toDto(entity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isNull();
        assertThat(dto.getName()).isEqualTo("Required Name");
        assertThat(dto.getExpertise()).isNull();
        assertThat(dto.getSuggestedTopic()).isNull();
        assertThat(dto.getBio()).isNull();
        assertThat(dto.getConfirmed()).isNull();
    }

    @Test
    void testBidirectionalMapping() {
        // Given
        Speaker originalDto = new Speaker();
        originalDto.setId(UUID.randomUUID());
        originalDto.setName("Bob Wilson");
        originalDto.setExpertise("Cybersecurity");
        originalDto.setConfirmed(true);

        // When
        SpeakerEntity entity = SpeakerMapper.toEntity(originalDto);
        Speaker convertedDto = SpeakerMapper.toDto(entity);

        // Then
        assertThat(convertedDto.getId()).isEqualTo(originalDto.getId());
        assertThat(convertedDto.getName()).isEqualTo(originalDto.getName());
        assertThat(convertedDto.getExpertise()).isEqualTo(originalDto.getExpertise());
        assertThat(convertedDto.getConfirmed()).isEqualTo(originalDto.getConfirmed());
    }

    @Test
    void testToEntity_WithMinimalFields() {
        // Given
        Speaker speaker = new Speaker();
        speaker.setName("Minimal Speaker");
        // Only required field set

        // When
        SpeakerEntity entity = SpeakerMapper.toEntity(speaker);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getName()).isEqualTo("Minimal Speaker");
        assertThat(entity.getExpertise()).isNull();
        assertThat(entity.getSuggestedTopic()).isNull();
        assertThat(entity.getBio()).isNull();
        assertThat(entity.getConfirmed()).isFalse(); // Default value is false in entity
    }

    @Test
    void testToDto_WithMinimalFields() {
        // Given
        SpeakerEntity entity = new SpeakerEntity();
        entity.setName("Minimal Entity");
        // Only required field set - but confirmed has default value false

        // When
        Speaker dto = SpeakerMapper.toDto(entity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getName()).isEqualTo("Minimal Entity");
        assertThat(dto.getExpertise()).isNull();
        assertThat(dto.getSuggestedTopic()).isNull();
        assertThat(dto.getBio()).isNull();
        assertThat(dto.getConfirmed()).isFalse(); // Default value in entity
    }
} 