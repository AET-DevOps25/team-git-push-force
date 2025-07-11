package de.tum.aet.devops25.conceptsvc;

import java.time.OffsetDateTime;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
public class PdfService {
    
    public Resource generateConceptPdf(ConceptEntity concept) {
        // Placeholder implementation - return a simple text file as "PDF"
        StringBuilder content = new StringBuilder();
        content.append("=== CONCEPT PDF REPORT ===\n\n");
        content.append("Title: ").append(concept.getTitle()).append("\n");
        content.append("Description: ").append(concept.getDescription() != null ? concept.getDescription() : "N/A").append("\n");
        content.append("Status: ").append(concept.getStatus()).append("\n");
        content.append("Created: ").append(concept.getCreatedAt()).append("\n");
        content.append("Updated: ").append(concept.getUpdatedAt()).append("\n");
        
        if (concept.getEventDetails() != null) {
            content.append("\n=== EVENT DETAILS ===\n");
            content.append("Theme: ").append(concept.getEventDetails().getTheme() != null ? concept.getEventDetails().getTheme() : "N/A").append("\n");
            content.append("Format: ").append(concept.getEventDetails().getFormat() != null ? concept.getEventDetails().getFormat() : "N/A").append("\n");
            content.append("Capacity: ").append(concept.getEventDetails().getCapacity() != null ? concept.getEventDetails().getCapacity() : "N/A").append("\n");
            content.append("Duration: ").append(concept.getEventDetails().getDuration() != null ? concept.getEventDetails().getDuration() : "N/A").append("\n");
        }
        
        if (concept.getAgenda() != null && !concept.getAgenda().isEmpty()) {
            content.append("\n=== AGENDA ===\n");
            concept.getAgenda().forEach(item -> {
                content.append("- ").append(item.getTime()).append(": ").append(item.getTitle()).append("\n");
            });
        }
        
        if (concept.getSpeakers() != null && !concept.getSpeakers().isEmpty()) {
            content.append("\n=== SPEAKERS ===\n");
            concept.getSpeakers().forEach(speaker -> {
                content.append("- ").append(speaker.getName()).append(" (").append(speaker.getExpertise()).append(")\n");
            });
        }
        
        content.append("\nGenerated at: ").append(OffsetDateTime.now()).append("\n");
        content.append("=== END OF REPORT ===");
        
        byte[] pdfBytes = content.toString().getBytes();
        return new ByteArrayResource(pdfBytes);
    }
} 