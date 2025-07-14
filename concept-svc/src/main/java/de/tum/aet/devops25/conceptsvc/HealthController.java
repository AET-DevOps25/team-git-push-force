package de.tum.aet.devops25.conceptsvc;

import java.time.OffsetDateTime;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import de.tum.aet.devops25.api.generated.controller.HealthApi;
import de.tum.aet.devops25.api.generated.model.GetConceptServiceHealth200Response;

@RestController
public class HealthController implements HealthApi {

    private final ConceptRepository conceptRepository;

    public HealthController(ConceptRepository conceptRepository) {
        this.conceptRepository = conceptRepository;
    }

    @Override
    public ResponseEntity<GetConceptServiceHealth200Response> getConceptServiceHealth() {
        GetConceptServiceHealth200Response response = new GetConceptServiceHealth200Response();
        response.setStatus("UP");
        response.setTimestamp(OffsetDateTime.now());
        response.setService("concept-service");
        
        // Optional: Test database connectivity
        try {
            conceptRepository.count();
            // Database is accessible, keep status as UP
        } catch (Exception e) {
            // Log error but still return UP for basic health check
            // In production, you might want to set status to DOWN
        }
        
        return ResponseEntity.ok(response);
    }
} 