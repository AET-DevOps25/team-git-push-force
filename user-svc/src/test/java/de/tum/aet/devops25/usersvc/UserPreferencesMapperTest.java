package de.tum.aet.devops25.usersvc;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import de.tum.aet.devops25.api.generated.model.UserPreferences;

class UserPreferencesMapperTest {

    @Test
    void testToEntity_WithValidUserPreferences() {
        // Create DTO
        UserPreferences dto = new UserPreferences();
        dto.setPreferredEventFormat(UserPreferences.PreferredEventFormatEnum.HYBRID);
        dto.setIndustry("Technology");
        dto.setLanguage("en");
        dto.setTimezone("UTC");

        // Convert to entity
        de.tum.aet.devops25.usersvc.UserPreferences entity = UserPreferencesMapper.toEntity(dto);

        // Verify conversion
        assertThat(entity).isNotNull();
        assertThat(entity.getPreferredEventFormat()).isEqualTo("HYBRID");
        assertThat(entity.getIndustry()).isEqualTo("Technology");
        assertThat(entity.getLanguage()).isEqualTo("en");
        assertThat(entity.getTimezone()).isEqualTo("UTC");
    }

    @Test
    void testToEntity_WithNullUserPreferences() {
        // Convert null DTO
        de.tum.aet.devops25.usersvc.UserPreferences entity = UserPreferencesMapper.toEntity(null);

        // Verify null handling
        assertThat(entity).isNull();
    }

    @Test
    void testToEntity_WithNullFields() {
        // Create DTO with null fields
        UserPreferences dto = new UserPreferences();
        dto.setPreferredEventFormat(null);
        dto.setIndustry(null);
        dto.setLanguage(null);
        dto.setTimezone(null);

        // Convert to entity
        de.tum.aet.devops25.usersvc.UserPreferences entity = UserPreferencesMapper.toEntity(dto);

        // Verify null field handling
        assertThat(entity).isNotNull();
        assertThat(entity.getPreferredEventFormat()).isNull();
        assertThat(entity.getIndustry()).isNull();
        assertThat(entity.getLanguage()).isNull();
        assertThat(entity.getTimezone()).isNull();
    }

    @Test
    void testToDto_WithValidEntity() {
        // Create entity
        de.tum.aet.devops25.usersvc.UserPreferences entity = new de.tum.aet.devops25.usersvc.UserPreferences();
        entity.setPreferredEventFormat("VIRTUAL");
        entity.setIndustry("Healthcare");
        entity.setLanguage("de");
        entity.setTimezone("Europe/Berlin");

        // Convert to DTO
        UserPreferences dto = UserPreferencesMapper.toDto(entity);

        // Verify conversion
        assertThat(dto).isNotNull();
        assertThat(dto.getPreferredEventFormat()).isEqualTo(UserPreferences.PreferredEventFormatEnum.VIRTUAL);
        assertThat(dto.getIndustry()).isEqualTo("Healthcare");
        assertThat(dto.getLanguage()).isEqualTo("de");
        assertThat(dto.getTimezone()).isEqualTo("Europe/Berlin");
    }

    @Test
    void testToDto_WithNullEntity() {
        // Convert null entity
        UserPreferences dto = UserPreferencesMapper.toDto(null);

        // Verify null handling
        assertThat(dto).isNull();
    }

    @Test
    void testToDto_WithNullFields() {
        // Create entity with null fields
        de.tum.aet.devops25.usersvc.UserPreferences entity = new de.tum.aet.devops25.usersvc.UserPreferences();
        entity.setPreferredEventFormat(null);
        entity.setIndustry(null);
        entity.setLanguage(null);
        entity.setTimezone(null);

        // Convert to DTO
        UserPreferences dto = UserPreferencesMapper.toDto(entity);

        // Verify null field handling
        assertThat(dto).isNotNull();
        assertThat(dto.getPreferredEventFormat()).isNull();
        assertThat(dto.getIndustry()).isNull();
        assertThat(dto.getLanguage()).isNull();
        assertThat(dto.getTimezone()).isNull();
    }

    @Test
    void testBidirectionalMapping() {
        // Create original DTO
        UserPreferences originalDto = new UserPreferences();
        originalDto.setPreferredEventFormat(UserPreferences.PreferredEventFormatEnum.PHYSICAL);
        originalDto.setIndustry("Finance");
        originalDto.setLanguage("fr");
        originalDto.setTimezone("Europe/Paris");

        // Convert to entity and back to DTO
        de.tum.aet.devops25.usersvc.UserPreferences entity = UserPreferencesMapper.toEntity(originalDto);
        UserPreferences resultDto = UserPreferencesMapper.toDto(entity);

        // Verify bidirectional mapping preserves data
        assertThat(resultDto.getPreferredEventFormat()).isEqualTo(originalDto.getPreferredEventFormat());
        assertThat(resultDto.getIndustry()).isEqualTo(originalDto.getIndustry());
        assertThat(resultDto.getLanguage()).isEqualTo(originalDto.getLanguage());
        assertThat(resultDto.getTimezone()).isEqualTo(originalDto.getTimezone());
    }

    @Test
    void testToEntity_WithPartialData() {
        // Create DTO with only some fields
        UserPreferences dto = new UserPreferences();
        dto.setPreferredEventFormat(UserPreferences.PreferredEventFormatEnum.HYBRID);
        dto.setLanguage("es");
        // industry and timezone are null

        // Convert to entity
        de.tum.aet.devops25.usersvc.UserPreferences entity = UserPreferencesMapper.toEntity(dto);

        // Verify partial mapping
        assertThat(entity).isNotNull();
        assertThat(entity.getPreferredEventFormat()).isEqualTo("HYBRID");
        assertThat(entity.getLanguage()).isEqualTo("es");
        assertThat(entity.getIndustry()).isNull();
        assertThat(entity.getTimezone()).isNull();
    }

    @Test
    void testToDto_WithPartialData() {
        // Create entity with only some fields
        de.tum.aet.devops25.usersvc.UserPreferences entity = new de.tum.aet.devops25.usersvc.UserPreferences();
        entity.setIndustry("Education");
        entity.setTimezone("Asia/Tokyo");
        // preferredEventFormat and language are null

        // Convert to DTO
        UserPreferences dto = UserPreferencesMapper.toDto(entity);

        // Verify partial mapping
        assertThat(dto).isNotNull();
        assertThat(dto.getIndustry()).isEqualTo("Education");
        assertThat(dto.getTimezone()).isEqualTo("Asia/Tokyo");
        assertThat(dto.getPreferredEventFormat()).isNull();
        assertThat(dto.getLanguage()).isNull();
    }

    @Test
    void testAllEventFormatEnumValues() {
        // Test all enum values
        for (UserPreferences.PreferredEventFormatEnum enumValue : UserPreferences.PreferredEventFormatEnum.values()) {
            UserPreferences dto = new UserPreferences();
            dto.setPreferredEventFormat(enumValue);

            de.tum.aet.devops25.usersvc.UserPreferences entity = UserPreferencesMapper.toEntity(dto);
            UserPreferences backToDto = UserPreferencesMapper.toDto(entity);

            assertThat(backToDto.getPreferredEventFormat()).isEqualTo(enumValue);
        }
    }
} 