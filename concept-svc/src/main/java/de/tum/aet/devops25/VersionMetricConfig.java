package de.tum.aet.devops25;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;

@Configuration
public class VersionMetricConfig {

    @Value("${app.version:unknown}")
    private String appVersion;

    @Value("${spring.application.name:unknown}")
    private String appName;

    private final MeterRegistry meterRegistry;

    public VersionMetricConfig(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @PostConstruct
    public void registerVersionMetric() {
        meterRegistry.gauge("app_version_info",
                java.util.Collections.singletonList(
                        io.micrometer.core.instrument.Tag.of("service", appName)
                ),
                appVersion.hashCode()
        );
        meterRegistry.gauge("app_version",
                java.util.Collections.singletonList(
                        io.micrometer.core.instrument.Tag.of("version", appVersion)
                ),
                1
        );
    }
}
