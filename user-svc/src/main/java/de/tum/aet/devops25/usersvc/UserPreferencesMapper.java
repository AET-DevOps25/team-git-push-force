package de.tum.aet.devops25.usersvc;

public class UserPreferencesMapper {

    // DTO → Entity
    public static UserPreferences toEntity(de.tum.aet.devops25.api.generated.model.UserPreferences dto) {
        if (dto == null) {
            return null;
        }
        UserPreferences entity = new UserPreferences();
        if (dto.getPreferredEventFormat() != null) {
            entity.setPreferredEventFormat(dto.getPreferredEventFormat().getValue());
        }
        entity.setIndustry(dto.getIndustry());
        entity.setLanguage(dto.getLanguage());
        entity.setTimezone(dto.getTimezone());
        return entity;
    }

    // Entity → DTO
    public static de.tum.aet.devops25.api.generated.model.UserPreferences toDto(UserPreferences entity) {
        if (entity == null) {
            return null;
        }
        de.tum.aet.devops25.api.generated.model.UserPreferences dto
                = new de.tum.aet.devops25.api.generated.model.UserPreferences();
        if (entity.getPreferredEventFormat() != null) {
            dto.setPreferredEventFormat(
                    de.tum.aet.devops25.api.generated.model.UserPreferences.PreferredEventFormatEnum.fromValue(
                            entity.getPreferredEventFormat()
                    )
            );
        }
        dto.setIndustry(entity.getIndustry());
        dto.setLanguage(entity.getLanguage());
        dto.setTimezone(entity.getTimezone());
        return dto;
    }
}
