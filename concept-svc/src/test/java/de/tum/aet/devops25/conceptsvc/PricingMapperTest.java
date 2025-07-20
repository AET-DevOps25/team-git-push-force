package de.tum.aet.devops25.conceptsvc;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import de.tum.aet.devops25.api.generated.model.Pricing;

class PricingMapperTest {

    @Test
    void testToEntity_WithValidPricing() {
        // Given
        Pricing pricing = new Pricing();
        pricing.setCurrency("USD");
        pricing.setEarlyBird(BigDecimal.valueOf(199.99));
        pricing.setRegular(BigDecimal.valueOf(299.99));
        pricing.setVip(BigDecimal.valueOf(499.99));
        pricing.setStudent(BigDecimal.valueOf(99.99));
        pricing.setGroup(BigDecimal.valueOf(249.99));

        // When
        PricingEntity entity = PricingMapper.toEntity(pricing);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getCurrency()).isEqualTo("USD");
        assertThat(entity.getEarlyBird()).isEqualTo(BigDecimal.valueOf(199.99));
        assertThat(entity.getRegular()).isEqualTo(BigDecimal.valueOf(299.99));
        assertThat(entity.getVip()).isEqualTo(BigDecimal.valueOf(499.99));
        assertThat(entity.getStudent()).isEqualTo(BigDecimal.valueOf(99.99));
        assertThat(entity.getGroup()).isEqualTo(BigDecimal.valueOf(249.99));
    }

    @Test
    void testToEntity_WithNullPricing() {
        // When
        PricingEntity entity = PricingMapper.toEntity(null);

        // Then
        assertThat(entity).isNull();
    }

    @Test
    void testToEntity_WithNullFields() {
        // Given
        Pricing pricing = new Pricing();
        pricing.setCurrency(null);
        pricing.setEarlyBird(null);
        pricing.setRegular(null);
        pricing.setVip(null);
        pricing.setStudent(null);
        pricing.setGroup(null);

        // When
        PricingEntity entity = PricingMapper.toEntity(pricing);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getCurrency()).isNull();
        assertThat(entity.getEarlyBird()).isNull();
        assertThat(entity.getRegular()).isNull();
        assertThat(entity.getVip()).isNull();
        assertThat(entity.getStudent()).isNull();
        assertThat(entity.getGroup()).isNull();
    }

    @Test
    void testToDto_WithValidEntity() {
        // Given
        PricingEntity entity = new PricingEntity();
        entity.setCurrency("EUR");
        entity.setEarlyBird(BigDecimal.valueOf(149.99));
        entity.setRegular(BigDecimal.valueOf(249.99));
        entity.setVip(BigDecimal.valueOf(399.99));
        entity.setStudent(BigDecimal.valueOf(79.99));
        entity.setGroup(BigDecimal.valueOf(199.99));

        // When
        Pricing dto = PricingMapper.toDto(entity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getCurrency()).isEqualTo("EUR");
        assertThat(dto.getEarlyBird()).isEqualTo(BigDecimal.valueOf(149.99));
        assertThat(dto.getRegular()).isEqualTo(BigDecimal.valueOf(249.99));
        assertThat(dto.getVip()).isEqualTo(BigDecimal.valueOf(399.99));
        assertThat(dto.getStudent()).isEqualTo(BigDecimal.valueOf(79.99));
        assertThat(dto.getGroup()).isEqualTo(BigDecimal.valueOf(199.99));
    }

    @Test
    void testToDto_WithNullEntity() {
        // When
        Pricing dto = PricingMapper.toDto(null);

        // Then
        assertThat(dto).isNull();
    }

    @Test
    void testToDto_WithNullFields() {
        // Given
        PricingEntity entity = new PricingEntity();
        entity.setCurrency(null);
        entity.setEarlyBird(null);
        entity.setRegular(null);
        entity.setVip(null);
        entity.setStudent(null);
        entity.setGroup(null);

        // When
        Pricing dto = PricingMapper.toDto(entity);

        // Then
        assertThat(dto).isNotNull();
        assertThat(dto.getCurrency()).isNull();
        assertThat(dto.getEarlyBird()).isNull();
        assertThat(dto.getRegular()).isNull();
        assertThat(dto.getVip()).isNull();
        assertThat(dto.getStudent()).isNull();
        assertThat(dto.getGroup()).isNull();
    }

    @Test
    void testBidirectionalMapping() {
        // Given
        Pricing originalDto = new Pricing();
        originalDto.setCurrency("GBP");
        originalDto.setEarlyBird(BigDecimal.valueOf(175.50));
        originalDto.setRegular(BigDecimal.valueOf(275.75));

        // When
        PricingEntity entity = PricingMapper.toEntity(originalDto);
        Pricing convertedDto = PricingMapper.toDto(entity);

        // Then
        assertThat(convertedDto.getCurrency()).isEqualTo(originalDto.getCurrency());
        assertThat(convertedDto.getEarlyBird()).isEqualTo(originalDto.getEarlyBird());
        assertThat(convertedDto.getRegular()).isEqualTo(originalDto.getRegular());
    }

    @Test
    void testToEntity_WithDefaultCurrency() {
        // Given
        Pricing pricing = new Pricing();
        pricing.setRegular(BigDecimal.valueOf(300.00));
        // Currency not set, should use default

        // When
        PricingEntity entity = PricingMapper.toEntity(pricing);

        // Then
        assertThat(entity).isNotNull();
        assertThat(entity.getRegular()).isEqualTo(BigDecimal.valueOf(300.00));
        // Currency should be "EUR" since that's the default in PricingEntity
        assertThat(entity.getCurrency()).isEqualTo("EUR");
    }
} 